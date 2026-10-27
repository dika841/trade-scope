import type { TPilotList, TPilotListInput } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { Effect } from "effect";
import { toPilotDto } from "#/pilot/application/to-pilot-dto.ts";
import { PilotRepo, type TPilotRepoId } from "#/pilot/domain/pilot.ts";
import type { EDatabase } from "#/shared/errors.ts";

export const pilotList = Effect.fn("pilotList")(function* (
	input: TPilotListInput,
): Effect.fn.Return<TPilotList, EDatabase, TPilotRepoId> {
	const repo = yield* PilotRepo;
	const { items, total } = yield* repo.list(input);

	return {
		items: A.map(items, toPilotDto),
		total,
		page: input.page,
		pageSize: input.pageSize,
	};
});
