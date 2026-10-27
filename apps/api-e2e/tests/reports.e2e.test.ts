import type { TReport, TReportList, TSharedReport } from "@app/schemas";
import { beforeAll, describe, expect, it } from "vitest";
import { apiFetch, apiJson } from "../support/api-fetch.ts";
import { SEED_CREDENTIALS, signIn } from "../support/sign-in.ts";

const STATUS_NOT_FOUND = 404;
const STATUS_FORBIDDEN = 403;

let adminCookie = "";
let viewerCookie = "";
let reportId = "";
let otherReportId = "";
let shareToken = "";

beforeAll(async (): Promise<void> => {
	adminCookie = await signIn(SEED_CREDENTIALS.admin);
	viewerCookie = await signIn(SEED_CREDENTIALS.viewer);
});

describe("report endpoints", () => {
	it("creates a snapshot for an admin", async (): Promise<void> => {
		const report = await apiJson<TReport>({
			path: "/reports",
			cookie: adminCookie,
			method: "POST",
			body: {
				hsCode: "090121",
				hsRevision: "HS2022",
				title: "E2E coffee report",
			},
		});

		reportId = report.id;
		shareToken = report.shareToken;

		expect(report.title).toBe("E2E coffee report");
		expect(report.payload.market.periodYear).toBe(2023);
		expect(report.payload.market.items[0]?.importerIso2).toBe("US");
		expect(
			report.payload.pilots.some((pilot) => pilot.marketIso2 === "US"),
		).toBe(true);
		expect(report.revokedAt).toBeNull();

		const other = await apiJson<TReport>({
			path: "/reports",
			cookie: adminCookie,
			method: "POST",
			body: {
				hsCode: "610910",
				hsRevision: "HS2022",
				title: "E2E apparel report",
			},
		});
		otherReportId = other.id;
	});

	it("lists reports for a viewer", async (): Promise<void> => {
		const list = await apiJson<TReportList>({
			path: "/reports",
			cookie: viewerCookie,
		});

		expect(list.items).toContainEqual(
			expect.objectContaining({ id: reportId, title: "E2E coffee report" }),
		);
	});

	it("serves the shared snapshot without a session", async (): Promise<void> => {
		const shared = await apiJson<TSharedReport>({
			path: `/reports/shared/${shareToken}`,
		});

		expect(shared.title).toBe("E2E coffee report");
		expect(shared.payload.market.totalValueUsd).toBeGreaterThan(0);
	});

	it("refuses a viewer creating a report", async (): Promise<void> => {
		const response = await apiFetch({
			path: "/reports",
			cookie: viewerCookie,
			method: "POST",
			body: { hsCode: "090121", hsRevision: "HS2022" },
		});

		expect(response.status).toBe(STATUS_FORBIDDEN);
	});

	it("revokes the share link and keeps the report", async (): Promise<void> => {
		const revoked = await apiJson<{ revokedAt: string | null }>({
			path: `/reports/${reportId}/revoke`,
			cookie: adminCookie,
			method: "POST",
		});

		expect(revoked.revokedAt).not.toBeNull();

		const shared = await apiFetch({
			path: `/reports/shared/${shareToken}`,
		});
		expect(shared.status).toBe(STATUS_NOT_FOUND);

		const internal = await apiJson<TReport>({
			path: `/reports/${reportId}`,
			cookie: adminCookie,
		});
		expect(internal.revokedAt).not.toBeNull();

		const other = await apiJson<TReport>({
			path: `/reports/${otherReportId}`,
			cookie: adminCookie,
		});
		expect(other.revokedAt).toBeNull();
	});

	it("deletes the report", async (): Promise<void> => {
		const response = await apiFetch({
			path: `/reports/${reportId}`,
			cookie: adminCookie,
			method: "DELETE",
		});

		expect(response.status).toBe(200);

		const detail = await apiFetch({
			path: `/reports/${reportId}`,
			cookie: adminCookie,
		});
		expect(detail.status).toBe(STATUS_NOT_FOUND);
	});
});
