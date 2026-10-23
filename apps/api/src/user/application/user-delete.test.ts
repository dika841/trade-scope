import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";
import { EForbidden } from "#/shared/errors.ts";
import { userDelete } from "#/user/application/user-delete.ts";
import { ActivityRecorder } from "#/shared/activity-recorder.ts";
import { UserRepo } from "#/user/domain/user.ts";

const ACTOR_ID = "22222222-2222-4222-8222-222222222222";

describe("userDelete", () => {
	it("refuses to delete the acting user", async (): Promise<void> => {
		const remove = vi.fn();
		const testLayer = Layer.mergeAll(
			Layer.succeed(
				UserRepo,
				UserRepo.of({
					list: vi.fn(),
					findById: vi.fn(),
					findByEmail: vi.fn(),
					create: vi.fn(),
					update: vi.fn(),
					remove,
					resetPassword: vi.fn(),
				}),
			),
			Layer.succeed(ActivityRecorder, ActivityRecorder.of({ insert: vi.fn() })),
		);

		const error = await Effect.runPromise(
			userDelete({ id: ACTOR_ID }, ACTOR_ID).pipe(
				Effect.provide(testLayer),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(EForbidden);
		expect(remove).not.toHaveBeenCalled();
	});
});
