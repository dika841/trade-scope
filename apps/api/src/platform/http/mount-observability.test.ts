import { loggerCreate } from "@app/logger";
import { metricsFake } from "@app/metrics/testing";
import { type TTracingMemory, tracingMemory, tracingOff } from "@app/tracing";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { describe, expect, it } from "vitest";
import { HTTP_STATUS } from "#/platform/http/http-status.ts";
import { observabilityMount } from "#/platform/http/mount-observability.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";

const URL_BASE = "http://localhost";
const BOOM = "/boom";

const SPAN_STATUS_ERROR = 2;

const logger = loggerCreate({ service: "test", env: "test", level: "fatal" });

const appWith = (): { app: Hono; metrics: ReturnType<typeof metricsFake> } => {
	const app = new Hono();
	const metrics = metricsFake();

	app.use("*", requestId());
	observabilityMount(app, { logger, metrics, tracing: tracingOff("test") });

	app.get(ROUTE_PATH.HEALTHZ, (context) => context.text("ok"));
	app.get(ROUTE_PATH.READY, (context) => context.text("ok"));
	app.get(ROUTE_PATH.METRICS, (context) => context.text("ok"));
	app.get("/users/:id", (context) => context.text("user"));
	app.get(BOOM, (): never => {
		throw new Error("handler exploded");
	});

	return { app, metrics };
};

describe("observabilityMount with tracing on", () => {
	it("marks the span an error when the handler throws, and still counts it", async (): Promise<void> => {
		const tracing: TTracingMemory = tracingMemory("test");
		const app = new Hono();
		const metrics = metricsFake();

		app.use("*", requestId());
		observabilityMount(app, { logger, metrics, tracing });
		app.get(BOOM, (): never => {
			throw new Error("handler exploded");
		});

		await app.request(`${URL_BASE}${BOOM}`);

		expect(tracing.finished()).toHaveLength(1);
		expect(tracing.finished()[0]?.status.code).toBe(SPAN_STATUS_ERROR);
		expect(metrics.observations[0]?.status).toBe(
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
		);

		await tracing.shutdown();
	});
});

describe("observabilityMount", () => {
	it("counts an ordinary request under its matched route", async (): Promise<void> => {
		const { app, metrics } = appWith();

		await app.request(`${URL_BASE}/users/abc-123`);

		expect(metrics.observations).toHaveLength(1);
		expect(metrics.observations[0]?.route).toBe("/users/:id");
		expect(metrics.observations[0]?.status).toBe(HTTP_STATUS.OK);
	});

	it("counts a request whose handler throws, as the 5xx the alert looks for", async (): Promise<void> => {
		const { app, metrics } = appWith();

		const response = await app.request(`${URL_BASE}${BOOM}`);

		expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
		expect(metrics.observations).toHaveLength(1);
		expect(metrics.observations[0]?.status).toBe(
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
		);
		expect(metrics.observations[0]?.route).toBe(BOOM);
	});

	it("leaves the probe paths out, so probe traffic cannot skew the error rate", async (): Promise<void> => {
		const { app, metrics } = appWith();

		await app.request(`${URL_BASE}${ROUTE_PATH.HEALTHZ}`);
		await app.request(`${URL_BASE}${ROUTE_PATH.READY}`);
		await app.request(`${URL_BASE}${ROUTE_PATH.METRICS}`);

		expect(metrics.observations).toEqual([]);
	});
});
