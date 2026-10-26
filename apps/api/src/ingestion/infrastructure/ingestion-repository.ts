import { and, count, eq, inArray, max, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { INGESTION_STATUS } from "@app/schemas";
import {
	IngestionRepo,
	type TIngestionCatalogCounts,
	type TIngestionRepo,
	type TIngestionRunRow,
} from "#/ingestion/domain/ingestion.ts";
import { DbService, dbServiceLayer } from "#/platform/db/db-service.ts";
import { offsetFor, orderFor } from "#/shared/pagination.ts";
import { dbActive } from "#/platform/db/transaction.ts";
import { user } from "#/platform/db/tables/auth.ts";
import { hsAlias, hsProduct } from "#/platform/db/tables/catalog.ts";
import { dataSource } from "#/platform/db/tables/data-source.ts";
import { ingestionRun } from "#/platform/db/tables/ingestion.ts";
import { EDatabase } from "#/shared/errors.ts";

const CHUNK_SIZE = 500;
const SOURCE_LABEL_MAX = 100;

const runColumns = {
	id: ingestionRun.id,
	sourceId: ingestionRun.sourceId,
	sourceName: dataSource.name,
	retryOfId: ingestionRun.retryOfId,
	mode: ingestionRun.mode,
	fileName: ingestionRun.fileName,
	payload: ingestionRun.payload,
	status: ingestionRun.status,
	totalRows: ingestionRun.totalRows,
	insertedRows: ingestionRun.insertedRows,
	updatedRows: ingestionRun.updatedRows,
	failedRows: ingestionRun.failedRows,
	errors: ingestionRun.errors,
	message: ingestionRun.message,
	triggeredBy: ingestionRun.triggeredBy,
	triggeredByEmail: user.email,
	startedAt: ingestionRun.startedAt,
	finishedAt: ingestionRun.finishedAt,
	createdAt: ingestionRun.createdAt,
	updatedAt: ingestionRun.updatedAt,
} as const;

const chunked = <T>(items: readonly T[], size: number = CHUNK_SIZE): T[][] => {
	const chunks: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		chunks.push(items.slice(index, index + size));
	}
	return chunks;
};

const sourceLabelOf = (value: string): string =>
	value.length <= SOURCE_LABEL_MAX ? value : value.slice(0, SOURCE_LABEL_MAX);

export const ingestionRepoLayer = Layer.effect(
	IngestionRepo,
	Effect.gen(function* () {
		const { db } = yield* DbService;

		const list: TIngestionRepo["list"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const connection = dbActive(db);
					const condition = and(
						input.status === undefined
							? undefined
							: eq(ingestionRun.status, input.status),
						input.sourceId === undefined
							? undefined
							: eq(ingestionRun.sourceId, input.sourceId),
					);
					const sortColumn =
						input.sortBy === "status"
							? ingestionRun.status
							: ingestionRun.createdAt;

					const rows = await connection
						.select(runColumns)
						.from(ingestionRun)
						.leftJoin(dataSource, eq(dataSource.id, ingestionRun.sourceId))
						.leftJoin(user, eq(user.id, ingestionRun.triggeredBy))
						.where(condition)
						.orderBy(orderFor(sortColumn, input.sortDir))
						.limit(input.pageSize)
						.offset(offsetFor(input));

					const [totalRow] = await connection
						.select({ value: count() })
						.from(ingestionRun)
						.where(condition);

					return {
						items: rows as TIngestionRunRow[],
						total: totalRow?.value ?? 0,
					};
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const getById: TIngestionRepo["getById"] = (id) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select(runColumns)
						.from(ingestionRun)
						.leftJoin(dataSource, eq(dataSource.id, ingestionRun.sourceId))
						.leftJoin(user, eq(user.id, ingestionRun.triggeredBy))
						.where(eq(ingestionRun.id, id))
						.limit(1);

					return (row as TIngestionRunRow | undefined) ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const create: TIngestionRepo["create"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.insert(ingestionRun)
						.values({
							sourceId: input.sourceId,
							retryOfId: input.retryOfId,
							mode: input.mode,
							fileName: input.fileName,
							payload: input.payload,
							status: INGESTION_STATUS.QUEUED,
							triggeredBy: input.triggeredBy,
						})
						.returning();

					return {
						...(row as TIngestionRunRow),
						sourceName: null,
						triggeredByEmail: null,
					};
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const markRunning: TIngestionRepo["markRunning"] = (id) =>
			Effect.tryPromise({
				try: async () => {
					const now = new Date();
					const [row] = await dbActive(db)
						.update(ingestionRun)
						.set({
							status: "running",
							startedAt: now,
							updatedAt: now,
						})
						.where(
							and(
								eq(ingestionRun.id, id),
								inArray(ingestionRun.status, ["queued", "running"]),
							),
						)
						.returning();

					return row === undefined
						? null
						: {
								...(row as TIngestionRunRow),
								sourceName: null,
								triggeredByEmail: null,
							};
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const finalize: TIngestionRepo["finalize"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const now = new Date();
					const [row] = await dbActive(db)
						.update(ingestionRun)
						.set({
							status: input.status,
							totalRows: input.totalRows,
							insertedRows: input.insertedRows,
							updatedRows: input.updatedRows,
							failedRows: input.failedRows,
							errors: input.errors,
							message: input.message,
							finishedAt: now,
							updatedAt: now,
						})
						.where(
							and(
								eq(ingestionRun.id, input.id),
								inArray(ingestionRun.status, ["queued", "running"]),
							),
						)
						.returning();

					return row === undefined
						? null
						: {
								...(row as TIngestionRunRow),
								sourceName: null,
								triggeredByEmail: null,
							};
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const failQueued: TIngestionRepo["failQueued"] = (id, message) =>
			Effect.tryPromise({
				try: async () => {
					const now = new Date();
					await dbActive(db)
						.update(ingestionRun)
						.set({
							status: "failed",
							message,
							finishedAt: now,
							updatedAt: now,
						})
						.where(
							and(eq(ingestionRun.id, id), eq(ingestionRun.status, "queued")),
						);
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const findSource: TIngestionRepo["findSource"] = (id) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select({
							id: dataSource.id,
							name: dataSource.name,
							url: dataSource.url,
							secretCiphertext: dataSource.secretCiphertext,
							isActive: dataSource.isActive,
						})
						.from(dataSource)
						.where(eq(dataSource.id, id))
						.limit(1);

					return row ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const upsertCatalog: TIngestionRepo["upsertCatalog"] = (input) =>
			Effect.tryPromise({
				try: async (): Promise<TIngestionCatalogCounts> => {
					if (input.products.length === 0) {
						return { inserted: 0, updated: 0, aliases: 0 };
					}

					const connection = dbActive(db);
					const label = sourceLabelOf(input.sourceLabel);
					const codes = Array.from(
						new Set(input.products.map((product) => product.hsCode)),
					);
					const existingRows = await connection
						.select({
							hsCode: hsProduct.hsCode,
							hsRevision: hsProduct.hsRevision,
						})
						.from(hsProduct)
						.where(inArray(hsProduct.hsCode, codes));
					const existing = new Set(
						existingRows.map((row) => `${row.hsCode}:${row.hsRevision}`),
					);

					let inserted = 0;
					let updated = 0;
					const ids = new Map<string, string>();

					for (const chunk of chunked(input.products)) {
						const rows = await connection
							.insert(hsProduct)
							.values(
								chunk.map((product) => ({
									hsCode: product.hsCode,
									hsRevision: product.hsRevision,
									description: product.description,
									parentHsCode: product.parentHsCode,
									level: product.level,
									source: label,
									validFrom: product.validFrom,
									validTo: product.validTo,
								})),
							)
							.onConflictDoUpdate({
								target: [hsProduct.hsCode, hsProduct.hsRevision],
								set: {
									description: sql`excluded.description`,
									parentHsCode: sql`excluded.parent_hs_code`,
									level: sql`excluded.level`,
									source: sql`excluded.source`,
									validFrom: sql`excluded.valid_from`,
									validTo: sql`excluded.valid_to`,
									updatedAt: new Date(),
								},
							})
							.returning({
								id: hsProduct.id,
								hsCode: hsProduct.hsCode,
								hsRevision: hsProduct.hsRevision,
							});

						for (const row of rows) {
							const key = `${row.hsCode}:${row.hsRevision}`;
							ids.set(key, row.id);

							if (existing.has(key)) {
								updated += 1;
							} else {
								inserted += 1;
							}
						}
					}

					const aliasValues = input.products.flatMap((product) => {
						const productId = ids.get(
							`${product.hsCode}:${product.hsRevision}`,
						);

						return productId === undefined
							? []
							: product.aliases.map((alias) => ({
									alias,
									hsProductId: productId,
									language: product.language,
									source: label,
								}));
					});

					let aliases = 0;

					for (const chunk of chunked(aliasValues)) {
						const rows = await connection
							.insert(hsAlias)
							.values(chunk)
							.onConflictDoNothing({
								target: [hsAlias.alias, hsAlias.hsProductId, hsAlias.language],
							})
							.returning({ id: hsAlias.id });
						aliases += rows.length;
					}

					return { inserted, updated, aliases };
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const stats: TIngestionRepo["stats"] = () =>
			Effect.tryPromise({
				try: async () => {
					const connection = dbActive(db);
					const rows = await connection
						.select({ status: ingestionRun.status, value: count() })
						.from(ingestionRun)
						.groupBy(ingestionRun.status);
					const [lastRow] = await connection
						.select({ value: max(ingestionRun.createdAt) })
						.from(ingestionRun);
					const countOf = (status: TIngestionRunRow["status"]): number =>
						rows.find((row) => row.status === status)?.value ?? 0;

					return {
						total: rows.reduce((sum, row) => sum + row.value, 0),
						queued: countOf("queued"),
						running: countOf("running"),
						succeeded: countOf("succeeded"),
						partial: countOf("partial"),
						failed: countOf("failed"),
						lastRunAt: (lastRow?.value as Date | null | undefined) ?? null,
					};
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		return IngestionRepo.of({
			list,
			getById,
			create,
			markRunning,
			finalize,
			failQueued,
			findSource,
			upsertCatalog,
			stats,
		});
	}),
).pipe(Layer.provide(dbServiceLayer));
