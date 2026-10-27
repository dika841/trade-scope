import type { TPilot, TPilotUpdateInput } from "@app/schemas";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { pilotUpdate } from "#/pilot/application/pilot-update.ts";
import {
	PilotRepo,
	type TPilotRepo,
	type TPilotRow,
} from "#/pilot/domain/pilot.ts";
import { ActivityRecorder } from "#/shared/activity-recorder.ts";
import { EBadRequest, EConflict, ENotFound } from "#/shared/errors.ts";

const ACTOR = "actor-id";

const ROW: TPilotRow = {
	id: "11111111-1111-4111-8111-111111111111",
	hsCode: "090121",
	hsRevision: "HS2022",
	productDescription: "Coffee, roasted",
	marketIso2: "US",
	marketName: "United States",
	status: "new",
	version: 0,
	ownerId: null,
	ownerName: null,
	ownerEmail: null,
	notes: null,
	createdBy: ACTOR,
	createdByEmail: "admin@test.app",
	createdAt: new Date("2026-01-01T00:00:00Z"),
	updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const baseRepo: TPilotRepo = {
	list: () => Effect.succeed({ items: [], total: 0 }),
	getById: () => Effect.succeed(ROW),
	listForProduct: () => Effect.succeed([ROW]),
	create: () => Effect.succeed(ROW),
	update: (input) =>
		Effect.succeed({ ...ROW, ...input, version: input.version + 1 }),
	findProduct: () => Effect.succeed({ hsCode: "090121", hsRevision: "HS2022" }),
	findMarket: () => Effect.succeed({ iso2: "US", name: "United States" }),
	findOwner: () =>
		Effect.succeed({
			id: "22222222-2222-4222-8222-222222222222",
			name: "Analyst",
			email: "analyst@test.app",
		}),
	listOwners: () => Effect.succeed([]),
	listMarkets: () => Effect.succeed([]),
};

const layer = (
	repo: TPilotRepo,
): Layer.Layer<
	typeof PilotRepo.Identifier | typeof ActivityRecorder.Identifier
> =>
	Layer.mergeAll(
		Layer.succeed(PilotRepo, PilotRepo.of(repo)),
		Layer.succeed(
			ActivityRecorder,
			ActivityRecorder.of({ insert: () => Effect.void }),
		),
	);

const run = (
	input: TPilotUpdateInput,
	repo: TPilotRepo = baseRepo,
): Promise<TPilot> =>
	Effect.runPromise(
		pilotUpdate(input, ACTOR).pipe(Effect.provide(layer(repo))),
	);

const INPUT: TPilotUpdateInput = {
	id: ROW.id,
	version: ROW.version,
	status: "in_review",
};

describe("pilotUpdate", () => {
	it("moves a new request into review", async (): Promise<void> => {
		const result = await run(INPUT);

		expect(result.status).toBe("in_review");
	});

	it("refuses a transition the workflow does not allow", async (): Promise<void> => {
		const error = await Effect.runPromise(
			pilotUpdate({ id: ROW.id, version: 0, status: "approved" }, ACTOR).pipe(
				Effect.provide(layer(baseRepo)),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(EConflict);
	});

	it("refuses an owner that does not exist", async (): Promise<void> => {
		const error = await Effect.runPromise(
			pilotUpdate(
				{
					id: ROW.id,
					version: 0,
					ownerId: "33333333-3333-4333-8333-333333333333",
				},
				ACTOR,
			).pipe(
				Effect.provide(
					layer({
						...baseRepo,
						findOwner: () => Effect.succeed(null),
					}),
				),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(EBadRequest);
	});

	it("fails when the request does not exist", async (): Promise<void> => {
		const error = await Effect.runPromise(
			pilotUpdate(INPUT, ACTOR).pipe(
				Effect.provide(
					layer({
						...baseRepo,
						getById: () => Effect.succeed(null),
					}),
				),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(ENotFound);
	});

	it("refuses a stale version before touching the row", async (): Promise<void> => {
		const error = await Effect.runPromise(
			pilotUpdate({ ...INPUT, version: 1 }, ACTOR).pipe(
				Effect.provide(layer(baseRepo)),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(EConflict);
	});

	it("reports a conflict when another update wins the race", async (): Promise<void> => {
		const error = await Effect.runPromise(
			pilotUpdate(INPUT, ACTOR).pipe(
				Effect.provide(
					layer({
						...baseRepo,
						update: () => Effect.succeed(null),
					}),
				),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(EConflict);
	});
});
