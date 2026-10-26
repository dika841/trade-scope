import { jobPublisherCreate } from "@app/queue";
import { Effect, Layer } from "effect";
import {
	IngestionQueue,
	type TIngestionQueue,
} from "#/ingestion/domain/ingestion.ts";
import { QUEUE_NAME } from "#/platform/queue/queue-names.ts";
import { QueueService, queueServiceLayer } from "#/platform/queue/rabbitmq.ts";
import { EQueue } from "#/shared/errors.ts";

export type TIngestionJobPayload = {
	runId: string;
};

export const ingestionQueueLayer = Layer.effect(
	IngestionQueue,
	Effect.gen(function* () {
		const queue = yield* QueueService;

		const enqueue: TIngestionQueue["enqueue"] = (runId) =>
			Effect.gen(function* () {
				const channel = yield* queue.channel();
				const publisher = yield* Effect.tryPromise({
					try: () =>
						jobPublisherCreate<TIngestionJobPayload>(
							QUEUE_NAME.INGESTION,
							channel,
						),
					catch: (cause) => new EQueue({ cause }),
				});

				yield* Effect.tryPromise({
					try: () => publisher.add({ runId }),
					catch: (cause) => new EQueue({ cause }),
				});
			});

		return IngestionQueue.of({ enqueue });
	}),
).pipe(Layer.provide(queueServiceLayer));
