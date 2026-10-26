import { INGESTION_MESSAGE } from "@app/messages";
import { Effect } from "effect";
import {
	IngestionQueue,
	type TIngestionQueueId,
} from "#/ingestion/domain/ingestion.ts";
import {
	IngestionRepo,
	type TIngestionRepoId,
} from "#/ingestion/domain/ingestion.ts";
import type { EDatabase, EQueue } from "#/shared/errors.ts";

export const ingestionEnqueue = Effect.fn("ingestionEnqueue")(function* (
	runId: string,
): Effect.fn.Return<
	void,
	EQueue | EDatabase,
	TIngestionRepoId | TIngestionQueueId
> {
	const repo = yield* IngestionRepo;
	const queue = yield* IngestionQueue;

	yield* queue
		.enqueue(runId)
		.pipe(
			Effect.catchTag("EQueue", (error) =>
				repo
					.failQueued(runId, INGESTION_MESSAGE.QUEUE_UNAVAILABLE)
					.pipe(Effect.flatMap(() => Effect.fail(error))),
			),
		);
});
