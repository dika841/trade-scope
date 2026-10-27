import { REPORT_SORT } from "@app/schemas";
import { and, count, eq, isNull } from "drizzle-orm";
import { Effect, Layer } from "effect";
import {
	ReportRepo,
	type TReportRepo,
	type TReportRow,
	type TReportSummaryRow,
} from "#/report/domain/report.ts";
import { DbService, dbServiceLayer } from "#/platform/db/db-service.ts";
import { offsetFor, orderFor } from "#/shared/pagination.ts";
import { dbActive } from "#/platform/db/transaction.ts";
import { user } from "#/platform/db/tables/auth.ts";
import { report } from "#/platform/db/tables/report.ts";
import { EDatabase } from "#/shared/errors.ts";

const summaryColumns = {
	id: report.id,
	title: report.title,
	hsCode: report.hsCode,
	hsRevision: report.hsRevision,
	productDescription: report.productDescription,
	periodYear: report.periodYear,
	shareToken: report.shareToken,
	revokedAt: report.revokedAt,
	createdBy: report.createdBy,
	createdByEmail: user.email,
	createdAt: report.createdAt,
	updatedAt: report.updatedAt,
} as const;

const fullColumns = {
	...summaryColumns,
	payload: report.payload,
} as const;

export const reportRepoLayer = Layer.effect(
	ReportRepo,
	Effect.gen(function* () {
		const { db } = yield* DbService;

		const rowById = async (id: string): Promise<TReportRow | null> => {
			const [row] = await dbActive(db)
				.select(fullColumns)
				.from(report)
				.leftJoin(user, eq(user.id, report.createdBy))
				.where(eq(report.id, id))
				.limit(1);

			return (row as TReportRow | undefined) ?? null;
		};

		const list: TReportRepo["list"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const sortColumn =
						input.sortBy === REPORT_SORT.TITLE
							? report.title
							: report.createdAt;

					const [rows, [totalRow]] = await Promise.all([
						dbActive(db)
							.select(summaryColumns)
							.from(report)
							.leftJoin(user, eq(user.id, report.createdBy))
							.orderBy(orderFor(sortColumn, input.sortDir))
							.limit(input.pageSize)
							.offset(offsetFor(input)),
						dbActive(db).select({ value: count() }).from(report),
					]);

					return {
						items: rows as TReportSummaryRow[],
						total: totalRow?.value ?? 0,
					};
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const getById: TReportRepo["getById"] = (id) =>
			Effect.tryPromise({
				try: () => rowById(id),
				catch: (cause) => new EDatabase({ cause }),
			});

		const getByShareToken: TReportRepo["getByShareToken"] = (token) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select(fullColumns)
						.from(report)
						.leftJoin(user, eq(user.id, report.createdBy))
						.where(eq(report.shareToken, token))
						.limit(1);

					return (row as TReportRow | undefined) ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const create: TReportRepo["create"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const [created] = await dbActive(db)
						.insert(report)
						.values({
							title: input.title,
							hsCode: input.hsCode,
							hsRevision: input.hsRevision,
							productDescription: input.productDescription,
							periodYear: input.periodYear,
							payload: input.payload,
							shareToken: input.shareToken,
							createdBy: input.createdBy,
						})
						.returning({ id: report.id });

					if (created === undefined) {
						throw new Error("report insert returned no row");
					}

					const row = await rowById(created.id);

					if (row === null) {
						throw new Error("report insert could not be read back");
					}

					return row;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const revoke: TReportRepo["revoke"] = (id) =>
			Effect.tryPromise({
				try: async () => {
					await dbActive(db)
						.update(report)
						.set({ revokedAt: new Date(), updatedAt: new Date() })
						.where(and(eq(report.id, id), isNull(report.revokedAt)));

					return rowById(id);
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const remove: TReportRepo["remove"] = (id) =>
			Effect.tryPromise({
				try: async () => {
					const rows = await dbActive(db)
						.delete(report)
						.where(eq(report.id, id))
						.returning({ id: report.id });

					return rows.length > 0;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		return ReportRepo.of({
			list,
			getById,
			getByShareToken,
			create,
			revoke,
			remove,
		});
	}),
).pipe(Layer.provide(dbServiceLayer));
