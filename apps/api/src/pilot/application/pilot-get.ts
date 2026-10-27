import { PILOT_MESSAGE } from "@app/messages";
import type { TPilot, TPilotIdInput } from "@app/schemas";
import { Effect } from "effect";
import { toPilotDto } from "#/pilot/application/to-pilot-dto.ts";
import { PilotRepo, type TPilotRepoId } from "#/pilot/domain/pilot.ts";
import { type EDatabase, ENotFound } from "#/shared/errors.ts";

export const pilotGet = Effect.fn("pilotGet")(function* ({
	id,
}: TPilotIdInput): Effect.fn.Return<
	TPilot,
	ENotFound | EDatabase,
	TPilotRepoId
> {
	const repo = yield* PilotRepo;
	const row = yield* repo.getById(id);

	if (row === null) {
		return yield* new ENotFound({ message: PILOT_MESSAGE.NOT_FOUND });
	}

	return toPilotDto(row);
});
