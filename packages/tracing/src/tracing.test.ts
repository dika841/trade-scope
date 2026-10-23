import { SpanKind, SpanStatusCode } from "@opentelemetry/api";
import {
	ATTR_HTTP_RESPONSE_STATUS_CODE,
	ATTR_HTTP_ROUTE,
} from "@opentelemetry/semantic-conventions";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { tracingMemory, type TTracingMemory } from "./tracing-memory.ts";
import {
	type TTracingIds,
	type TTracingOutcome,
	tracingCurrentIds,
	tracingHeadersInject,
	tracingRequestRun,
} from "./tracing-request.ts";
import { tracingStart } from "./tracing.ts";

const SERVICE = "api";
const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;

const PARENT_TRACE_ID = "0af7651916cd43dd8448eb211c80319c";
const PARENT_SPAN_ID = "b7ad6b7169203331";
const TRACEPARENT = `00-${PARENT_TRACE_ID}-${PARENT_SPAN_ID}-01`;

const ROUTE = "/healthz";

const request = {
	method: "GET",
	path: ROUTE,
	headers: {},
};

const ok = async (): Promise<TTracingOutcome> => ({
	status: HTTP_OK,
	route: ROUTE,
});

describe("tracingStart", () => {
	it("stays off when no collector endpoint is configured", (): void => {
		expect(
			tracingStart({ service: SERVICE, version: "0.0.0", endpoint: undefined })
				.enabled,
		).toBe(false);
		expect(
			tracingStart({ service: SERVICE, version: "0.0.0", endpoint: "" })
				.enabled,
		).toBe(false);
	});

	it("still runs the handler when it is off, with no ids to log", async (): Promise<void> => {
		const off = tracingStart({
			service: SERVICE,
			version: "0.0.0",
			endpoint: undefined,
		});

		let seen: TTracingIds | undefined;

		await tracingRequestRun(
			off,
			request,
			async (ids): Promise<TTracingOutcome> => {
				seen = ids;
				return { status: HTTP_OK, route: ROUTE };
			},
		);

		expect(seen).toEqual({ traceId: undefined, spanId: undefined });
	});
});

describe("tracingRequestRun", () => {
	let tracing: TTracingMemory;

	beforeEach((): void => {
		tracing = tracingMemory(SERVICE);
	});

	afterEach(async (): Promise<void> => {
		await tracing.shutdown();
	});

	it("records one server span named for the matched route", async (): Promise<void> => {
		await tracingRequestRun(tracing, request, ok);

		const [span] = tracing.finished();

		expect(tracing.finished()).toHaveLength(1);
		expect(span?.name).toBe("GET /healthz");
		expect(span?.kind).toBe(SpanKind.SERVER);
		expect(span?.attributes[ATTR_HTTP_ROUTE]).toBe("/healthz");
		expect(span?.attributes[ATTR_HTTP_RESPONSE_STATUS_CODE]).toBe(HTTP_OK);
	});

	it("marks a 5xx as an error and leaves a 200 unset", async (): Promise<void> => {
		await tracingRequestRun(
			tracing,
			request,
			async (): Promise<TTracingOutcome> => ({
				status: HTTP_SERVER_ERROR,
				route: ROUTE,
			}),
		);

		expect(tracing.finished()[0]?.status.code).toBe(SpanStatusCode.ERROR);

		tracing.reset();

		await tracingRequestRun(tracing, request, ok);

		expect(tracing.finished()[0]?.status.code).toBe(SpanStatusCode.UNSET);
	});

	it("continues an incoming trace rather than starting a new one", async (): Promise<void> => {
		await tracingRequestRun(
			tracing,
			{ ...request, headers: { traceparent: TRACEPARENT } },
			ok,
		);

		const [span] = tracing.finished();

		expect(span?.spanContext().traceId).toBe(PARENT_TRACE_ID);
		expect(span?.parentSpanContext?.spanId).toBe(PARENT_SPAN_ID);
	});

	it("makes the span active inside the handler, so a log line can carry its ids", async (): Promise<void> => {
		let seen: TTracingIds | undefined;

		await tracingRequestRun(
			tracing,
			request,
			async (): Promise<TTracingOutcome> => {
				seen = tracingCurrentIds();
				return { status: HTTP_OK, route: ROUTE };
			},
		);

		expect(seen?.traceId).toBe(tracing.finished()[0]?.spanContext().traceId);
	});

	it("injects a traceparent an outgoing call can carry onward", async (): Promise<void> => {
		let carrier: Record<string, string> = {};

		await tracingRequestRun(
			tracing,
			{ ...request, headers: { traceparent: TRACEPARENT } },
			async (): Promise<TTracingOutcome> => {
				carrier = tracingHeadersInject();
				return { status: HTTP_OK, route: ROUTE };
			},
		);

		expect(carrier.traceparent).toContain(PARENT_TRACE_ID);
	});

	it("ends the span and rethrows when the handler throws", async (): Promise<void> => {
		const failing = tracingRequestRun(
			tracing,
			request,
			async (): Promise<TTracingOutcome> => {
				throw new Error("boom");
			},
		);

		await expect(failing).rejects.toThrow("boom");
		expect(tracing.finished()[0]?.status.code).toBe(SpanStatusCode.ERROR);
	});
});
