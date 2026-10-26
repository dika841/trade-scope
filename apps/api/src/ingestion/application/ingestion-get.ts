import { INGESTION_MESSAGE } from "@app/messages";
import type { TIngestionIdInput, TIngestionRunDetail } from "@app/schemas";
import { Effect } from "effect";
import { toIngestionRunDetailDto } from "#/ingestion/application/to-ingestion-run-dto.ts";
import {
	IngestionRepo,
	type TIngestionRepoId,
} from "#/ingestion/domain/ingestion.ts";
import { type EDatabase, ENotFound } from "#/shared/errors.ts";

export const ingestionGet = Effect.fn("ingestionGet")(function* ({
	id,
}: TIngestionIdInput): Effect.fn.Return<
	TIngestionRunDetail,
	ENotFound | EDatabase,
	TIngestionRepoId
> {
	const repo = yield* IngestionRepo;
	const row = yield* repo.getById(id);

	if (row === null) {
		return yield* new ENotFound({
			message: INGESTION_MESSAGE.NOT_FOUND_TITLE,
		});
	}

	return toIngestionRunDetailDto(row);
});
