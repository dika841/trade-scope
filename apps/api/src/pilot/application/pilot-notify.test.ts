import { PILOT_MAIL_KIND, type TMailMessage } from "@app/mail";
import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";
import { pilotNotify } from "#/pilot/application/pilot-notify.ts";
import {
	PilotRepo,
	type TPilotRepo,
	type TPilotRow,
} from "#/pilot/domain/pilot.ts";
import { MailService } from "#/platform/mail/mailer.ts";

vi.mock("#/platform/config/env.ts", () => ({
	env: { WEB_ORIGIN: "https://app.test" },
}));

vi.mock("#/platform/observability/logger.ts", () => ({
	logger: { error: vi.fn(), info: vi.fn() },
}));

const OWNER_ID = "22222222-2222-4222-8222-222222222222";
const ACTOR_ID = "33333333-3333-4333-8333-333333333333";

const ROW: TPilotRow = {
	id: "11111111-1111-4111-8111-111111111111",
	hsCode: "090121",
	hsRevision: "HS2022",
	productDescription: "Coffee, roasted",
	marketIso2: "US",
	marketName: "United States",
	status: "new",
	version: 0,
	ownerId: OWNER_ID,
	ownerName: "Owner",
	ownerEmail: "owner@test.app",
	notes: null,
	createdBy: ACTOR_ID,
	createdByEmail: "admin@test.app",
	createdAt: new Date("2026-01-01T00:00:00Z"),
	updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const repo: TPilotRepo = {
	list: () => Effect.succeed({ items: [], total: 0 }),
	getById: () => Effect.succeed(ROW),
	listForProduct: () => Effect.succeed([]),
	create: () => Effect.succeed(ROW),
	update: () => Effect.succeed(ROW),
	findProduct: () => Effect.succeed(null),
	findMarket: () => Effect.succeed(null),
	findOwner: () => Effect.succeed(null),
	listOwners: () => Effect.succeed([]),
	listMarkets: () => Effect.succeed([]),
};

const run = (
	send: (message: TMailMessage) => Promise<void>,
	actorId = ACTOR_ID,
) =>
	Effect.runPromise(
		pilotNotify({ id: ROW.id, kind: PILOT_MAIL_KIND.ASSIGNED }, actorId).pipe(
			Effect.provide(
				Layer.mergeAll(
					Layer.succeed(PilotRepo, PilotRepo.of(repo)),
					Layer.succeed(
						MailService,
						MailService.of({
							mailer: { send, close: () => undefined },
						}),
					),
				),
			),
		),
	);

describe("pilotNotify", () => {
	it("emails the owner with a link to the pilot", async (): Promise<void> => {
		const send = vi.fn<(message: TMailMessage) => Promise<void>>(() =>
			Promise.resolve(),
		);

		await run(send);

		expect(send).toHaveBeenCalledTimes(1);
		expect(send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "owner@test.app",
				subject: expect.stringContaining("Coffee, roasted"),
			}),
		);
		const message = send.mock.calls[0]?.[0];
		expect(message?.text).toContain(`https://app.test/pilots/${ROW.id}`);
	});

	it("does not email the owner for their own action", async (): Promise<void> => {
		const send = vi.fn<(message: TMailMessage) => Promise<void>>(() =>
			Promise.resolve(),
		);

		await run(send, OWNER_ID);

		expect(send).not.toHaveBeenCalled();
	});
});
