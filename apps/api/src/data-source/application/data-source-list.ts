import type { TDataSourceList } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { Effect } from "effect";
import { toDataSourceDto } from "#/data-source/application/to-data-source-dto.ts";
import {
	DataSourceRepo,
	type TDataSourceRepoId,
} from "#/data-source/domain/data-source.ts";
import type { EDatabase } from "#/shared/errors.ts";

export const dataSourceList = Effect.fn("dataSourceList")(
	function* (): Effect.fn.Return<
		TDataSourceList,
		EDatabase,
		TDataSourceRepoId
	> {
		const repo = yield* DataSourceRepo;
		const rows = yield* repo.list();

		return { items: A.map(rows, toDataSourceDto) };
	},
);
