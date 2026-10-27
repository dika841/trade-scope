import {
	PILOT_STATUS,
	type TPilot,
	type TPilotList,
	type TPilotOptions,
} from "@app/schemas";
import { beforeAll, describe, expect, it } from "vitest";
import { apiFetch, apiJson } from "../support/api-fetch.ts";
import { SEED_CREDENTIALS, signIn } from "../support/sign-in.ts";

const STATUS_FORBIDDEN = 403;
const STATUS_CONFLICT = 409;

let adminCookie = "";
let analystCookie = "";
let viewerCookie = "";

beforeAll(async (): Promise<void> => {
	adminCookie = await signIn(SEED_CREDENTIALS.admin);
	analystCookie = await signIn(SEED_CREDENTIALS.analyst);
	viewerCookie = await signIn(SEED_CREDENTIALS.viewer);
});

const createPilot = (notes: string): Promise<TPilot> =>
	apiJson<TPilot>({
		path: "/pilots",
		cookie: adminCookie,
		method: "POST",
		body: {
			hsCode: "090121",
			hsRevision: "HS2022",
			marketIso2: "US",
			notes,
		},
	});

describe("pilot endpoints", () => {
	it("lists seeded pilots for a viewer", async (): Promise<void> => {
		const list = await apiJson<TPilotList>({
			path: "/pilots",
			cookie: viewerCookie,
		});

		expect(list.total).toBeGreaterThanOrEqual(3);
		expect(
			list.items.some((pilot) => pilot.productDescription.includes("Coffee")),
		).toBe(true);
	});

	it("offers owners and markets for the form", async (): Promise<void> => {
		const options = await apiJson<TPilotOptions>({
			path: "/pilots/options",
			cookie: viewerCookie,
		});

		expect(options.markets).toContainEqual(
			expect.objectContaining({ iso2: "US", name: "United States" }),
		);
		expect(options.owners.length).toBeGreaterThan(0);
	});

	it("creates a pilot and moves it into review", async (): Promise<void> => {
		const created = await createPilot("E2E pilot request");
		expect(created.status).toBe(PILOT_STATUS.NEW);
		expect(created.marketName).toBe("United States");

		const updated = await apiJson<TPilot>({
			path: `/pilots/${created.id}`,
			cookie: adminCookie,
			method: "PATCH",
			body: {
				id: created.id,
				version: created.version,
				status: PILOT_STATUS.IN_REVIEW,
			},
		});

		expect(updated.status).toBe(PILOT_STATUS.IN_REVIEW);
	});

	it("refuses a transition the workflow does not allow", async (): Promise<void> => {
		const created = await createPilot("E2E skipped transition");
		const response = await apiFetch({
			path: `/pilots/${created.id}`,
			cookie: adminCookie,
			method: "PATCH",
			body: {
				id: created.id,
				version: created.version,
				status: PILOT_STATUS.APPROVED,
			},
		});

		expect(response.status).toBe(STATUS_CONFLICT);
	});

	it("refuses two updates that start from the same version", async (): Promise<void> => {
		const created = await createPilot("E2E concurrent pilot");

		const first = await apiFetch({
			path: `/pilots/${created.id}`,
			cookie: adminCookie,
			method: "PATCH",
			body: {
				id: created.id,
				version: created.version,
				ownerId: null,
				notes: "First writer",
			},
		});
		expect(first.status).toBe(200);

		const second = await apiFetch({
			path: `/pilots/${created.id}`,
			cookie: adminCookie,
			method: "PATCH",
			body: {
				id: created.id,
				version: created.version,
				ownerId: null,
				notes: "Second writer",
			},
		});
		expect(second.status).toBe(STATUS_CONFLICT);
	});

	it("returns the activity timeline for one pilot", async (): Promise<void> => {
		const created = await createPilot("E2E activity pilot");
		await apiJson<TPilot>({
			path: `/pilots/${created.id}`,
			cookie: adminCookie,
			method: "PATCH",
			body: {
				id: created.id,
				version: created.version,
				status: PILOT_STATUS.IN_REVIEW,
			},
		});

		const activity = await apiJson<{
			items: readonly { action: string; resourceId: string }[];
		}>({
			path: `/activity?resourceType=pilot&resourceId=${created.id}&pageSize=50`,
			cookie: adminCookie,
		});

		expect(
			activity.items.some((entry) => entry.action === "pilot.create"),
		).toBe(true);
		expect(
			activity.items.some((entry) => entry.action === "pilot.update"),
		).toBe(true);
		expect(
			activity.items.every((entry) => entry.resourceId === created.id),
		).toBe(true);
	});

	it("refuses an analyst creating a pilot", async (): Promise<void> => {
		const response = await apiFetch({
			path: "/pilots",
			cookie: analystCookie,
			method: "POST",
			body: {
				hsCode: "090121",
				hsRevision: "HS2022",
				marketIso2: "US",
			},
		});

		expect(response.status).toBe(STATUS_FORBIDDEN);
	});

	it("filters the list by status", async (): Promise<void> => {
		const list = await apiJson<TPilotList>({
			path: `/pilots?status=${PILOT_STATUS.IN_REVIEW}`,
			cookie: adminCookie,
		});

		expect(list.items.length).toBeGreaterThan(0);
		expect(
			list.items.every((pilot) => pilot.status === PILOT_STATUS.IN_REVIEW),
		).toBe(true);
	});
});
