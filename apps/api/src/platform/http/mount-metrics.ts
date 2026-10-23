import { timingSafeEqual } from "node:crypto";
import type { TMetrics } from "@app/metrics";
import type { Hono } from "hono";
import { match, P } from "ts-pattern";
import { HTTP_STATUS } from "#/platform/http/http-status.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";

const AUTHORIZATION_HEADER = "authorization";
const BEARER_PREFIX = "Bearer ";
const CONTENT_TYPE_HEADER = "Content-Type";

const UNAUTHORIZED_BODY = "";

export type TMetricsMountDeps = {
	metrics: TMetrics;
	enabled: boolean;
	token: string | undefined;
};

const presented = (header: string | undefined): string =>
	match(header)
		.with(P.string.startsWith(BEARER_PREFIX), (found): string =>
			found.slice(BEARER_PREFIX.length),
		)
		.otherwise((): string => "");

const tokenMatches = (
	expected: string,
	header: string | undefined,
): boolean => {
	const offered = Buffer.from(presented(header));
	const wanted = Buffer.from(expected);

	return match(offered.length === wanted.length)
		.with(false, (): boolean => false)
		.otherwise((): boolean => timingSafeEqual(offered, wanted));
};

const isAuthorised = (
	token: string | undefined,
	header: string | undefined,
): boolean =>
	match(token)
		.with(P.nullish, (): boolean => true)
		.otherwise((found): boolean => tokenMatches(found, header));

export const metricsMount = (app: Hono, deps: TMetricsMountDeps): void => {
	match(deps.enabled)
		.with(false, (): void => undefined)
		.otherwise((): void => {
			app.get(
				ROUTE_PATH.METRICS,
				async (context): Promise<Response> =>
					match(
						isAuthorised(deps.token, context.req.header(AUTHORIZATION_HEADER)),
					)
						.with(
							false,
							(): Promise<Response> =>
								Promise.resolve(
									context.text(UNAUTHORIZED_BODY, HTTP_STATUS.UNAUTHORIZED),
								),
						)
						.otherwise(async (): Promise<Response> => {
							context.header(CONTENT_TYPE_HEADER, deps.metrics.contentType);
							return context.body(await deps.metrics.render());
						}),
			);
		});
};
