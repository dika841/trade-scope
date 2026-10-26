import { DATA_SOURCE_MESSAGE } from "@app/messages";
import type { TDataSource, TDataSourceIdInput } from "@app/schemas";
import { Effect } from "effect";
import { toDataSourceDto } from "#/data-source/application/to-data-source-dto.ts";
import {
	DataSourceRepo,
	type TDataSourceRepoId,
} from "#/data-source/domain/data-source.ts";
import { type EDatabase, ENotFound } from "#/shared/errors.ts";

export const dataSourceGet = Effect.fn("dataSourceGet")(function* ({
	id,
}: TDataSourceIdInput): Effect.fn.Return<
	TDataSource,
	ENotFound | EDatabase,
	TDataSourceRepoId
> {
	const repo = yield* DataSourceRepo;
	const row = yield* repo.findById(id);

	if (row === null) {
		return yield* new ENotFound({ message: DATA_SOURCE_MESSAGE.NOT_FOUND });
	}

	return toDataSourceDto(row);
});
