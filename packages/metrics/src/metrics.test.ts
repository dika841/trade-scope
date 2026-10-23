import { A } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { describe, expect, it } from "vitest";
import { metricsFake } from "./metrics-fake.ts";
import {
	METRICS_ROUTE_UNMATCHED,
	metricsRouteNormalise,
} from "./metrics-route.ts";
import { METRIC_NAME, METRICS_CONTENT_TYPE, metricsCreate } from "./metrics.ts";

const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;

const sampleValue = (
	rendered: string,
	name: string,
	labels: readonly string[],
): number | undefined => {
	const line = A.find(
		rendered.split("\n"),
		(candidate): boolean =>
			candidate.startsWith(name) &&
			A.all(labels, (label): boolean => candidate.includes(label)),
	);

	return match(line)
		.with(P.nullish, (): number | undefined => undefined)
		.otherwise((found): number | undefined => Number(found.split(" ").at(-1)));
};

describe("metricsCreate", () => {
	it("exposes the prometheus text content type", (): void => {
		expect(metricsCreate({ service: "api" }).contentType).toBe(
			METRICS_CONTENT_TYPE,
		);
	});

	it("collects process metrics without any request", async (): Promise<void> => {
		const rendered = await metricsCreate({ service: "api" }).render();

		expect(rendered).toContain("process_cpu_seconds_total");
		expect(rendered).toContain('service="api"');
	});

	it("counts a request under its method, route and status", async (): Promise<void> => {
		const metrics = metricsCreate({ service: "api" });

		metrics.requestObserve("GET", "/healthz", HTTP_OK, 12);

		const rendered = await metrics.render();

		expect(
			sampleValue(rendered, METRIC_NAME.HTTP_REQUESTS_TOTAL, [
				'method="GET"',
				'route="/healthz"',
				'status="200"',
			]),
		).toBe(1);
	});

	it("keeps a failing request apart from a successful one", async (): Promise<void> => {
		const metrics = metricsCreate({ service: "api" });

		metrics.requestObserve("GET", "/api/users", HTTP_OK, 5);
		metrics.requestObserve("GET", "/api/users", HTTP_SERVER_ERROR, 5);
		metrics.requestObserve("GET", "/api/users", HTTP_SERVER_ERROR, 5);

		const rendered = await metrics.render();

		expect(
			sampleValue(rendered, METRIC_NAME.HTTP_REQUESTS_TOTAL, [
				'route="/api/users"',
				'status="200"',
			]),
		).toBe(1);
		expect(
			sampleValue(rendered, METRIC_NAME.HTTP_REQUESTS_TOTAL, [
				'route="/api/users"',
				'status="500"',
			]),
		).toBe(2);
	});

	it("records duration in seconds rather than milliseconds", async (): Promise<void> => {
		const metrics = metricsCreate({ service: "api" });

		metrics.requestObserve("GET", "/healthz", HTTP_OK, 1_500);

		const rendered = await metrics.render();

		expect(
			sampleValue(
				rendered,
				`${METRIC_NAME.HTTP_REQUEST_DURATION_SECONDS}_sum`,
				['route="/healthz"'],
			),
		).toBe(1.5);
	});
});

describe("metricsRouteNormalise", () => {
	it("keeps a matched route template", (): void => {
		expect(metricsRouteNormalise("/api/users/:id")).toBe("/api/users/:id");
	});

	it("replaces an unmatched route so the label never goes blank", (): void => {
		expect(metricsRouteNormalise(undefined)).toBe(METRICS_ROUTE_UNMATCHED);
		expect(metricsRouteNormalise("")).toBe(METRICS_ROUTE_UNMATCHED);
	});
});

describe("metricsFake", () => {
	it("records what it was asked to observe", (): void => {
		const metrics = metricsFake();

		metrics.requestObserve("POST", "/api/users", HTTP_OK, 3);

		expect(metrics.observations).toEqual([
			{ method: "POST", route: "/api/users", status: HTTP_OK, durationMs: 3 },
		]);
	});
});
