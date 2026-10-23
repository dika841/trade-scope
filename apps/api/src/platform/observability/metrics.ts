import { type TMetrics, metricsCreate, metricsNoop } from "@app/metrics";
import { match } from "ts-pattern";
import { env } from "#/platform/config/env.ts";

const SERVICE = "api";

export const metrics: TMetrics = match(env.METRICS_ENABLED)
	.with(true, (): TMetrics => metricsCreate({ service: SERVICE }))
	.otherwise((): TMetrics => metricsNoop());
