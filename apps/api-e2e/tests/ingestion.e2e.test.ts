import {
	INGESTION_STATUS,
	isIngestionTerminal,
	type TDataSource,
	type TIngestionRun,
	type TIngestionRunDetail,
} from "@app/schemas";
import { beforeAll, describe, expect, it } from "vitest";
import { apiFetch, apiJson } from "../support/api-fetch.ts";
import { API_PORT } from "../support/services.ts";
import { SEED_CREDENTIALS, signIn } from "../support/sign-in.ts";

const STAMP = Date.now().toString().slice(-6);
const SOURCE_NAME = `E2E source ${STAMP}`;
const SOURCE_URL = "https://example.com/hs-codes.csv";
const NEW_HS_CODE = `88${STAMP.slice(-4)}`;
const POLL_INTERVAL_MS = 250;
const POLL_TIMEOUT_MS = 20_000;
const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_FORBIDDEN = 403;
const STATUS_NOT_FOUND = 404;
const STATUS_CONFLICT = 409;

const CSV_TEMPLATE = `hs_code,hs_revision,description,parent_hs_code,level,aliases,language
090121,HS2022,"Coffee, roasted, not decaffeinated",0901,6,roasted coffee,en
${NEW_HS_CODE},HS2022,E2E imported product,9999,6,e2e product,en
bad-code,HS2022,Bad row,,6,,en
`;

let adminCookie = "";
let analystCookie = "";
let viewerCookie = "";
let sourceId = "";

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

const waitForRun = async (
	id: string,
	cookie: string,
): Promise<TIngestionRunDetail> => {
	const deadline = Date.now() + POLL_TIMEOUT_MS;

	while (Date.now() < deadline) {
		const run = await apiJson<TIngestionRunDetail>({
			path: `/ingestion/${id}`,
			cookie,
		});

		if (isIngestionTerminal(run.status)) {
			return run;
		}

		await sleep(POLL_INTERVAL_MS);
	}

	throw new Error(`Run ${id} did not finish within ${POLL_TIMEOUT_MS}ms`);
};

const runUpload = async (
	cookie: string,
	fileName: string,
	content: string,
): Promise<TIngestionRun> =>
	apiJson<TIngestionRun>({
		path: "/ingestion",
		cookie,
		method: "POST",
		body: { mode: "upload", fileName, content },
	});

beforeAll(async (): Promise<void> => {
	adminCookie = await signIn(SEED_CREDENTIALS.admin);
	analystCookie = await signIn(SEED_CREDENTIALS.analyst);
	viewerCookie = await signIn(SEED_CREDENTIALS.viewer);
});

describe("data source endpoints", () => {
	it("lets a superadmin create a source without ever returning its token", async (): Promise<void> => {
		const response = await apiFetch({
			path: "/data-sources",
			cookie: adminCookie,
			method: "POST",
			body: {
				name: SOURCE_NAME,
				url: SOURCE_URL,
				secret: "e2e-token-value-1234",
				isActive: true,
			},
		});

		expect(response.status).toBe(STATUS_OK);
		const source = (await response.json()) as TDataSource;
		sourceId = source.id;

		expect(source.hasSecret).toBe(true);
		expect(source.secretHint).toBe("1234");
		expect(Object.hasOwn(source, "secretCiphertext")).toBe(false);

		const duplicate = await apiFetch({
			path: "/data-sources",
			cookie: adminCookie,
			method: "POST",
			body: { name: SOURCE_NAME, url: SOURCE_URL },
		});
		expect(duplicate.status).toBe(STATUS_CONFLICT);
	});

	it("lets an analyst read the list but not manage credentials", async (): Promise<void> => {
		const list = await apiFetch({
			path: "/data-sources",
			cookie: analystCookie,
		});
		expect(list.status).toBe(STATUS_OK);

		const create = await apiFetch({
			path: "/data-sources",
			cookie: analystCookie,
			method: "POST",
			body: { name: `${SOURCE_NAME} denied`, url: SOURCE_URL },
		});
		expect(create.status).toBe(STATUS_FORBIDDEN);
	});

	it("lets a viewer read the list", async (): Promise<void> => {
		const list = await apiFetch({
			path: "/data-sources",
			cookie: viewerCookie,
		});
		expect(list.status).toBe(STATUS_OK);
	});
});

describe("ingestion through the worker", () => {
	it("refuses to run for a viewer", async (): Promise<void> => {
		const response = await apiFetch({
			path: "/ingestion",
			cookie: viewerCookie,
			method: "POST",
			body: { mode: "upload", fileName: "denied.csv", content: CSV_TEMPLATE },
		});
		expect(response.status).toBe(STATUS_FORBIDDEN);
	});

	it("imports a CSV, updates an existing code and reports the rejected row", async (): Promise<void> => {
		const created = await runUpload(
			analystCookie,
			"e2e-ingestion.csv",
			CSV_TEMPLATE,
		);
		expect(created.status).toBe(INGESTION_STATUS.QUEUED);

		const run = await waitForRun(created.id, analystCookie);
		expect(run.status).toBe(INGESTION_STATUS.PARTIAL);
		expect(run.totalRows).toBe(3);
		expect(run.insertedRows).toBe(1);
		expect(run.updatedRows).toBe(1);
		expect(run.failedRows).toBe(1);
		expect(run.errors).toHaveLength(1);
		expect(run.triggeredByEmail).toBe(SEED_CREDENTIALS.analyst.email);

		const product = await apiJson<{ aliases: readonly string[] }>({
			path: `/products/${NEW_HS_CODE}?revision=HS2022`,
		});
		expect(product.aliases).toContain("e2e product");
	});

	it("queues a new run when a finished run is retried", async (): Promise<void> => {
		const created = await runUpload(
			analystCookie,
			"e2e-ingestion-retry.csv",
			CSV_TEMPLATE,
		);
		const original = await waitForRun(created.id, analystCookie);

		const response = await apiFetch({
			path: `/ingestion/${original.id}/retry`,
			cookie: analystCookie,
			method: "POST",
		});
		expect(response.status).toBe(STATUS_OK);
		const retried = (await response.json()) as TIngestionRun;
		expect(retried.retryOfId).toBe(original.id);

		const finished = await waitForRun(retried.id, analystCookie);
		expect(finished.status).toBe(INGESTION_STATUS.PARTIAL);
	});

	it("reports run counts to a viewer", async (): Promise<void> => {
		const stats = await apiJson<{
			total: number;
			partial: number;
			failed: number;
		}>({ path: "/ingestion/stats", cookie: viewerCookie });

		expect(stats.total).toBeGreaterThan(0);
		expect(stats.partial).toBeGreaterThan(0);
	});

	it("fails a source run without fetching a loopback endpoint, then refuses a disabled source", async (): Promise<void> => {
		const blocked = await apiJson<TDataSource>({
			path: "/data-sources",
			cookie: adminCookie,
			method: "POST",
			body: {
				name: `E2E blocked ${STAMP}`,
				url: `http://127.0.0.1:${API_PORT}/healthz`,
				isActive: true,
			},
		});

		const created = await apiJson<TIngestionRun>({
			path: "/ingestion",
			cookie: analystCookie,
			method: "POST",
			body: { mode: "source", sourceId: blocked.id },
		});
		const run = await waitForRun(created.id, analystCookie);

		expect(run.status).toBe(INGESTION_STATUS.FAILED);
		expect(run.message).toContain("private or loopback");
		expect(run.sourceName).toBe(blocked.name);

		const disabled = await apiFetch({
			path: `/data-sources/${blocked.id}`,
			cookie: adminCookie,
			method: "PATCH",
			body: { id: blocked.id, isActive: false },
		});
		expect(disabled.status).toBe(STATUS_OK);

		const refused = await apiFetch({
			path: "/ingestion",
			cookie: analystCookie,
			method: "POST",
			body: { mode: "source", sourceId: blocked.id },
		});
		expect(refused.status).toBe(STATUS_BAD_REQUEST);

		await apiFetch({
			path: `/data-sources/${blocked.id}`,
			cookie: adminCookie,
			method: "DELETE",
		});
	});
});

describe("data source deletion", () => {
	it("refuses an analyst and accepts a superadmin", async (): Promise<void> => {
		const denied = await apiFetch({
			path: `/data-sources/${sourceId}`,
			cookie: analystCookie,
			method: "DELETE",
		});
		expect(denied.status).toBe(STATUS_FORBIDDEN);

		const deleted = await apiFetch({
			path: `/data-sources/${sourceId}`,
			cookie: adminCookie,
			method: "DELETE",
		});
		expect(deleted.status).toBe(STATUS_OK);

		const missing = await apiFetch({
			path: `/data-sources/${sourceId}`,
			cookie: adminCookie,
		});
		expect(missing.status).toBe(STATUS_NOT_FOUND);
	});
});
