import { context, propagation, trace } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import {
	InMemorySpanExporter,
	type ReadableSpan,
	SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import type { TTracing } from "./tracing.ts";

export type TTracingMemory = TTracing & {
	finished: () => readonly ReadableSpan[];
	reset: () => void;
};

export const tracingMemory = (service: string): TTracingMemory => {
	const exporter = new InMemorySpanExporter();
	const provider = new NodeTracerProvider({
		spanProcessors: [new SimpleSpanProcessor(exporter)],
	});

	provider.register({ propagator: new W3CTraceContextPropagator() });

	const shutdown = async (): Promise<void> => {
		await provider.shutdown();
		trace.disable();
		context.disable();
		propagation.disable();
	};

	return {
		enabled: true,
		tracer: provider.getTracer(service),
		finished: (): readonly ReadableSpan[] => exporter.getFinishedSpans(),
		reset: (): void => exporter.reset(),
		shutdown,
	};
};
