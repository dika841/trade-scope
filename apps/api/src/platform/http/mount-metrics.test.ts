import { metricsFake } from "@app/metrics/testing";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { HTTP_STATUS } from "#/platform/http/http-status.ts";
import { metricsMount } from "#/platform/http/mount-metrics.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";

const TOKEN = "a-32-character-metrics-scrape-tok";
const NOT_FOUND = 404;
const URL_BASE = "http://localhost";

const appWith = (enabled: boolean, token: string | undefined): Hono => {
	const app = new Hono();
	metricsMount(app, { metrics: metricsFake(), enabled, token });
	return app;
};

const request = async (
	app: Hono,
	headers?: Record<string, string>,
): Promise<Response> =>
	await app.request(`${URL_BASE}${ROUTE_PATH.METRICS}`, { headers });

describe("metricsMount", () => {
	it("does not register the route when metrics are disabled", async (): Promise<void> => {
		const response = await request(appWith(false, TOKEN));

		expect(response.status).toBe(NOT_FOUND);
	});

	it("serves the registry when no token is configured", async (): Promise<void> => {
		const response = await request(appWith(true, undefined));

		expect(response.status).toBe(HTTP_STATUS.OK);
	});

	it("refuses a scrape with no authorization header", async (): Promise<void> => {
		const response = await request(appWith(true, TOKEN));

		expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
	});

	it("refuses a wrong token of the same length", async (): Promise<void> => {
		const response = await request(appWith(true, TOKEN), {
			authorization: `Bearer ${"b".repeat(TOKEN.length)}`,
		});

		expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
	});

	it("refuses a token sent without the bearer scheme", async (): Promise<void> => {
		const response = await request(appWith(true, TOKEN), {
			authorization: TOKEN,
		});

		expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
	});

	it("serves the registry for the configured token", async (): Promise<void> => {
		const response = await request(appWith(true, TOKEN), {
			authorization: `Bearer ${TOKEN}`,
		});

		expect(response.status).toBe(HTTP_STATUS.OK);
		expect(response.headers.get("content-type")).toContain("text/plain");
	});
});
