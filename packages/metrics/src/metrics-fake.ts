import { A } from "@mobily/ts-belt";
import { METRICS_CONTENT_TYPE, type TMetrics } from "./metrics.ts";

export type TMetricsObservation = {
	method: string;
	route: string;
	status: number;
	durationMs: number;
};

export type TMetricsFake = TMetrics & {
	observations: TMetricsObservation[];
};

export const metricsFake = (): TMetricsFake => {
	const observations: TMetricsObservation[] = [];

	const requestObserve: TMetrics["requestObserve"] = (
		method,
		route,
		status,
		durationMs,
	) => {
		observations.push({ method, route, status, durationMs });
	};

	return {
		observations,
		requestObserve,
		render: async (): Promise<string> =>
			A.join(
				A.map(
					observations,
					(observation): string =>
						`${observation.method} ${observation.route} ${observation.status}`,
				),
				"\n",
			),
		contentType: METRICS_CONTENT_TYPE,
	};
};
