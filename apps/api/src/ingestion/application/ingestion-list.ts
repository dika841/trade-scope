import type { TIngestionList, TIngestionListInput } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { Effect } from "effect";
import { toIngestionRunDto } from "#/ingestion/application/to-ingestion-run-dto.ts";
import {
	IngestionRepo,
	type TIngestionRepoId,
} from "#/ingestion/domain/ingestion.ts";
import type { EDatabase } from "#/shared/errors.ts";

export const ingestionList = Effect.fn("ingestionList")(function* (
	input: TIngestionListInput,
): Effect.fn.Return<TIngestionList, EDatabase, TIngestionRepoId> {
	const repo = yield* IngestionRepo;
	const page = yield* repo.list(input);

	return {
		items: A.map(page.items, toIngestionRunDto),
		total: page.total,
		page: input.page,
		pageSize: input.pageSize,
	};
});
