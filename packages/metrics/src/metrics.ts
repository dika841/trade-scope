import {
	Counter,
	Histogram,
	Registry,
	collectDefaultMetrics,
} from "prom-client";

export const METRICS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8";

export const METRIC_NAME = {
	HTTP_REQUESTS_TOTAL: "http_requests_total",
	HTTP_REQUEST_DURATION_SECONDS: "http_request_duration_seconds",
} as const;

export const METRIC_LABEL = {
	METHOD: "method",
	ROUTE: "route",
	STATUS: "status",
} as const;

export const METRICS_BUCKETS_SECONDS: readonly number[] = [
	0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

const MS_PER_SECOND = 1_000;

export type TMetricsOptions = {
	service: string;
	buckets?: readonly number[];
};

export type TMetrics = {
	requestObserve: (
		method: string,
		route: string,
		status: number,
		durationMs: number,
	) => void;
	render: () => Promise<string>;
	contentType: string;
};

const LABEL_NAMES = [
	METRIC_LABEL.METHOD,
	METRIC_LABEL.ROUTE,
	METRIC_LABEL.STATUS,
];

export const metricsCreate = (options: TMetricsOptions): TMetrics => {
	const registry = new Registry();

	registry.setDefaultLabels({ service: options.service });
	collectDefaultMetrics({ register: registry });

	const requests = new Counter({
		name: METRIC_NAME.HTTP_REQUESTS_TOTAL,
		help: "Requests handled, by method, matched route and status",
		labelNames: LABEL_NAMES,
		registers: [registry],
	});

	const duration = new Histogram({
		name: METRIC_NAME.HTTP_REQUEST_DURATION_SECONDS,
		help: "Request duration in seconds, by method, matched route and status",
		labelNames: LABEL_NAMES,
		buckets: [...(options.buckets ?? METRICS_BUCKETS_SECONDS)],
		registers: [registry],
	});

	const requestObserve: TMetrics["requestObserve"] = (
		method,
		route,
		status,
		durationMs,
	) => {
		const labels = {
			[METRIC_LABEL.METHOD]: method,
			[METRIC_LABEL.ROUTE]: route,
			[METRIC_LABEL.STATUS]: String(status),
		};

		requests.inc(labels);
		duration.observe(labels, durationMs / MS_PER_SECOND);
	};

	return {
		requestObserve,
		render: (): Promise<string> => registry.metrics(),
		contentType: METRICS_CONTENT_TYPE,
	};
};

export const metricsNoop = (): TMetrics => ({
	requestObserve: (): void => undefined,
	render: async (): Promise<string> => "",
	contentType: METRICS_CONTENT_TYPE,
});
