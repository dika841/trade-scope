import { type Tracer, trace } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
	BatchSpanProcessor,
	TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { match, P } from "ts-pattern";

export const TRACING_SAMPLE_RATIO_DEFAULT = 1;

export type TTracingOptions = {
	service: string;
	version: string;
	endpoint: string | undefined;
	headers?: Record<string, string>;
	sampleRatio?: number;
};

export type TTracing = {
	enabled: boolean;
	tracer: Tracer;
	shutdown: () => Promise<void>;
};

const tracerFor = (service: string): Tracer => trace.getTracer(service);

const providerStart = (
	options: TTracingOptions,
	endpoint: string,
): TTracing => {
	const provider = new NodeTracerProvider({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: options.service,
			[ATTR_SERVICE_VERSION]: options.version,
		}),
		sampler: new TraceIdRatioBasedSampler(
			options.sampleRatio ?? TRACING_SAMPLE_RATIO_DEFAULT,
		),
		spanProcessors: [
			new BatchSpanProcessor(
				new OTLPTraceExporter({ url: endpoint, headers: options.headers }),
			),
		],
	});

	provider.register({ propagator: new W3CTraceContextPropagator() });

	return {
		enabled: true,
		tracer: tracerFor(options.service),
		shutdown: (): Promise<void> => provider.shutdown(),
	};
};

export const tracingStart = (options: TTracingOptions): TTracing =>
	match(options.endpoint)
		.with(P.nullish, (): TTracing => tracingOff(options.service))
		.with("", (): TTracing => tracingOff(options.service))
		.otherwise((endpoint): TTracing => providerStart(options, endpoint));

export const tracingOff = (service: string): TTracing => ({
	enabled: false,
	tracer: tracerFor(service),
	shutdown: async (): Promise<void> => undefined,
});
