import type { TIngestionStats } from "@app/schemas";
import { Effect } from "effect";
import {
	IngestionRepo,
	type TIngestionRepoId,
} from "#/ingestion/domain/ingestion.ts";
import type { EDatabase } from "#/shared/errors.ts";

export const ingestionStats = Effect.fn("ingestionStats")(
	function* (): Effect.fn.Return<TIngestionStats, EDatabase, TIngestionRepoId> {
		const repo = yield* IngestionRepo;
		const row = yield* repo.stats();

		return {
			total: row.total,
			queued: row.queued,
			running: row.running,
			succeeded: row.succeeded,
			partial: row.partial,
			failed: row.failed,
			lastRunAt: row.lastRunAt === null ? null : row.lastRunAt.toISOString(),
		};
	},
);
