import type { TSharedReport } from "@app/schemas";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { reportShared } from "#/report/application/report-shared.ts";
import {
	ReportRepo,
	type TReportRepo,
	type TReportRow,
} from "#/report/domain/report.ts";
import { ENotFound } from "#/shared/errors.ts";

const ROW: TReportRow = {
	id: "11111111-1111-4111-8111-111111111111",
	title: "Coffee — 2023",
	hsCode: "090121",
	hsRevision: "HS2022",
	productDescription: "Coffee, roasted",
	periodYear: 2023,
	shareToken: "share-token-value-123456",
	revokedAt: null,
	createdBy: "actor-id",
	createdByEmail: "admin@test.app",
	createdAt: new Date("2026-01-01T00:00:00Z"),
	updatedAt: new Date("2026-01-01T00:00:00Z"),
	payload: {
		market: {
			hsCode: "090121",
			hsRevision: "HS2022",
			periodYear: 2023,
			previousPeriodYear: 2022,
			totalValueUsd: 100,
			items: [],
			provenance: [],
		},
		pilots: [],
	},
};

const baseRepo: TReportRepo = {
	list: () => Effect.succeed({ items: [], total: 0 }),
	getById: () => Effect.succeed(ROW),
	getByShareToken: () => Effect.succeed(ROW),
	create: () => Effect.succeed(ROW),
	revoke: () => Effect.succeed(ROW),
	remove: () => Effect.succeed(true),
};

const layer = (repo: TReportRepo): Layer.Layer<typeof ReportRepo.Identifier> =>
	Layer.succeed(ReportRepo, ReportRepo.of(repo));

const run = (repo: TReportRepo = baseRepo): Promise<TSharedReport> =>
	Effect.runPromise(
		reportShared({ token: "share-token-value-123456" }).pipe(
			Effect.provide(layer(repo)),
		),
	);

describe("reportShared", () => {
	it("returns the snapshot while the link is active", async (): Promise<void> => {
		const result = await run();

		expect(result.title).toBe("Coffee — 2023");
		expect(result.payload.market.periodYear).toBe(2023);
	});

	it("hides a revoked link", async (): Promise<void> => {
		const error = await Effect.runPromise(
			reportShared({ token: "share-token-value-123456" }).pipe(
				Effect.provide(
					layer({
						...baseRepo,
						getByShareToken: () =>
							Effect.succeed({
								...ROW,
								revokedAt: new Date("2026-01-02T00:00:00Z"),
							}),
					}),
				),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(ENotFound);
	});

	it("hides an unknown token", async (): Promise<void> => {
		const error = await Effect.runPromise(
			reportShared({ token: "share-token-value-123456" }).pipe(
				Effect.provide(
					layer({ ...baseRepo, getByShareToken: () => Effect.succeed(null) }),
				),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(ENotFound);
	});
});
