import { Effect, Layer } from "effect";
import { describe, expect, it, type Mock, vi } from "vitest";
import { EForbidden, ENotFound } from "#/shared/errors.ts";
import { userPasswordReset } from "#/user/application/user-password-reset.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";
import { UserRepo, type TUserRepoId } from "#/user/domain/user.ts";

const ACTOR_ID = "22222222-2222-4222-8222-222222222222";
const TARGET_ID = "11111111-1111-4111-8111-111111111111";

const layerBuild = (
	findById: Mock,
	resetPassword: Mock,
): Layer.Layer<TUserRepoId | TActivityRecorderId> =>
	Layer.mergeAll(
		Layer.succeed(
			UserRepo,
			UserRepo.of({
				list: vi.fn(),
				findById,
				findByEmail: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				remove: vi.fn(),
				resetPassword,
			}),
		),
		Layer.succeed(ActivityRecorder, ActivityRecorder.of({ insert: vi.fn() })),
	);

describe("userPasswordReset", () => {
	it("refuses to reset the acting user's own password", async (): Promise<void> => {
		const resetPassword = vi.fn();

		const error = await Effect.runPromise(
			userPasswordReset(
				{ id: ACTOR_ID, password: "new-password-123" },
				ACTOR_ID,
			).pipe(Effect.provide(layerBuild(vi.fn(), resetPassword)), Effect.flip),
		);

		expect(error).toBeInstanceOf(EForbidden);
		expect(resetPassword).not.toHaveBeenCalled();
	});

	it("fails with ENotFound for an unknown user", async (): Promise<void> => {
		const findById = vi.fn().mockReturnValue(Effect.succeed(null));
		const resetPassword = vi.fn();

		const error = await Effect.runPromise(
			userPasswordReset(
				{ id: TARGET_ID, password: "new-password-123" },
				ACTOR_ID,
			).pipe(Effect.provide(layerBuild(findById, resetPassword)), Effect.flip),
		);

		expect(error).toBeInstanceOf(ENotFound);
		expect(resetPassword).not.toHaveBeenCalled();
	});
});
