import { match, P } from "ts-pattern";

export const METRICS_ROUTE_UNMATCHED = "unmatched";

export const metricsRouteNormalise = (route: string | undefined): string =>
	match(route)
		.with(P.nullish, (): string => METRICS_ROUTE_UNMATCHED)
		.with("", (): string => METRICS_ROUTE_UNMATCHED)
		.otherwise((found): string => found);
