import { type TTracing, tracingStart } from "@app/tracing";
import { APP_VERSION } from "@app/version";
import { D } from "@mobily/ts-belt";
import { env } from "#/platform/config/env.ts";

const SERVICE = "api";

const headersFor = (
	headers: Record<string, unknown> | undefined,
): Record<string, string> =>
	D.map(headers ?? {}, (value): string => String(value));

export const tracing: TTracing = tracingStart({
	service: SERVICE,
	version: APP_VERSION,
	endpoint: env.TRACING_ENDPOINT,
	headers: headersFor(env.TRACING_HEADERS),
	sampleRatio: env.TRACING_SAMPLE_RATIO,
});
