import {
	ROOT_CONTEXT,
	SpanKind,
	SpanStatusCode,
	context as otelContext,
	propagation,
	trace,
} from "@opentelemetry/api";
import {
	ATTR_HTTP_REQUEST_METHOD,
	ATTR_HTTP_RESPONSE_STATUS_CODE,
	ATTR_HTTP_ROUTE,
	ATTR_URL_PATH,
} from "@opentelemetry/semantic-conventions";
import { match, P } from "ts-pattern";
import type { TTracing } from "./tracing.ts";

const SERVER_ERROR_FROM = 500;

export type TTracingIds = {
	traceId: string | undefined;
	spanId: string | undefined;
};

export type TTracingRequest = {
	method: string;
	path: string;
	headers: Record<string, string | undefined>;
};

export type TTracingOutcome = {
	status: number;
	route: string;
};

export const TRACING_IDS_NONE: TTracingIds = {
	traceId: undefined,
	spanId: undefined,
};

const statusFor = (status: number): SpanStatusCode =>
	match(status >= SERVER_ERROR_FROM)
		.with(true, (): SpanStatusCode => SpanStatusCode.ERROR)
		.otherwise((): SpanStatusCode => SpanStatusCode.UNSET);

const spanRun = async (
	tracing: TTracing,
	request: TTracingRequest,
	handle: (ids: TTracingIds) => Promise<TTracingOutcome>,
): Promise<void> => {
	const parent = propagation.extract(ROOT_CONTEXT, request.headers);

	const span = tracing.tracer.startSpan(
		request.method,
		{
			kind: SpanKind.SERVER,
			attributes: {
				[ATTR_HTTP_REQUEST_METHOD]: request.method,
				[ATTR_URL_PATH]: request.path,
			},
		},
		parent,
	);

	const active = trace.setSpan(parent, span);
	const spanContext = span.spanContext();

	try {
		const outcome = await otelContext.with(active, () =>
			handle({
				traceId: spanContext.traceId,
				spanId: spanContext.spanId,
			}),
		);

		span.updateName(`${request.method} ${outcome.route}`);
		span.setAttribute(ATTR_HTTP_ROUTE, outcome.route);
		span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, outcome.status);
		span.setStatus({ code: statusFor(outcome.status) });
	} catch (error) {
		span.setStatus({ code: SpanStatusCode.ERROR });
		span.recordException(error as Error);
		throw error;
	} finally {
		span.end();
	}
};

export const tracingRequestRun = (
	tracing: TTracing,
	request: TTracingRequest,
	handle: (ids: TTracingIds) => Promise<TTracingOutcome>,
): Promise<void> =>
	match(tracing.enabled)
		.with(false, async (): Promise<void> => {
			await handle(TRACING_IDS_NONE);
		})
		.otherwise((): Promise<void> => spanRun(tracing, request, handle));

export const tracingHeadersInject = (): Record<string, string> => {
	const carrier: Record<string, string> = {};
	propagation.inject(otelContext.active(), carrier);
	return carrier;
};

export const tracingCurrentIds = (): TTracingIds =>
	match(trace.getSpan(otelContext.active()))
		.with(P.nullish, (): TTracingIds => TRACING_IDS_NONE)
		.otherwise(
			(span): TTracingIds => ({
				traceId: span.spanContext().traceId,
				spanId: span.spanContext().spanId,
			}),
		);
