import type { TLogger } from "@app/logger";
import { type TMetrics, metricsRouteNormalise } from "@app/metrics";
import {
	type TTracing,
	type TTracingOutcome,
	tracingRequestRun,
} from "@app/tracing";
import { A } from "@mobily/ts-belt";
import type { Hono } from "hono";
import { match } from "ts-pattern";
import { HTTP_STATUS } from "#/platform/http/http-status.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";

const REQUEST_EVENT = "request";

const PROBE_PATH: readonly string[] = [
	ROUTE_PATH.HEALTHZ,
	ROUTE_PATH.READY,
	ROUTE_PATH.METRICS,
];

export type TObservabilityMountDeps = {
	logger: TLogger;
	metrics: TMetrics;
	tracing: TTracing;
};

export const observabilityMount = (
	app: Hono,
	deps: TObservabilityMountDeps,
): void => {
	app.use("*", async (context, next): Promise<void> => {
		const reqId = context.get("requestId");
		const start = Date.now();
		const method = context.req.method;
		const path = context.req.path;

		await tracingRequestRun(
			deps.tracing,
			{ method, path, headers: context.req.header() },
			async (ids): Promise<TTracingOutcome> => {
				let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

				try {
					await next();
					status = context.res.status;
					return {
						status,
						route: metricsRouteNormalise(context.req.routePath),
					};
				} finally {
					const durMs = Date.now() - start;
					const route = metricsRouteNormalise(context.req.routePath);

					const line = {
						reqId,
						traceId: ids.traceId,
						spanId: ids.spanId,
						method,
						path,
						status,
						durMs,
					};

					match(A.includes(PROBE_PATH, path))
						.with(true, (): void => {
							deps.logger.debug(line, REQUEST_EVENT);
						})
						.otherwise((): void => {
							deps.logger.info(line, REQUEST_EVENT);
							deps.metrics.requestObserve(method, route, status, durMs);
						});
				}
			},
		);
	});
};
