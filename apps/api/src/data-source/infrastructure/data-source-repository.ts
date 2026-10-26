import { asc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import {
	DataSourceRepo,
	type TDataSourceRepo,
	type TDataSourceRow,
} from "#/data-source/domain/data-source.ts";
import { DbService, dbServiceLayer } from "#/platform/db/db-service.ts";
import { dbActive } from "#/platform/db/transaction.ts";
import { dataSource } from "#/platform/db/tables/data-source.ts";
import { EDatabase } from "#/shared/errors.ts";

export const dataSourceRepoLayer = Layer.effect(
	DataSourceRepo,
	Effect.gen(function* () {
		const { db } = yield* DbService;

		const list: TDataSourceRepo["list"] = () =>
			Effect.tryPromise({
				try: async () => {
					const rows = await dbActive(db)
						.select()
						.from(dataSource)
						.orderBy(asc(dataSource.name));
					return rows as TDataSourceRow[];
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const findById: TDataSourceRepo["findById"] = (id) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select()
						.from(dataSource)
						.where(eq(dataSource.id, id))
						.limit(1);
					return (row as TDataSourceRow | undefined) ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const findByName: TDataSourceRepo["findByName"] = (name) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select()
						.from(dataSource)
						.where(eq(dataSource.name, name))
						.limit(1);
					return (row as TDataSourceRow | undefined) ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const create: TDataSourceRepo["create"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.insert(dataSource)
						.values({
							name: input.name,
							kind: input.kind,
							url: input.url,
							secretCiphertext: input.secretCiphertext,
							secretHint: input.secretHint,
							isActive: input.isActive,
							createdBy: input.createdBy,
						})
						.returning();
					return row as TDataSourceRow;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const update: TDataSourceRepo["update"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const patch: Partial<typeof dataSource.$inferInsert> = {
						updatedAt: new Date(),
					};

					if (input.name !== undefined) {
						patch.name = input.name;
					}
					if (input.url !== undefined) {
						patch.url = input.url;
					}
					if (input.isActive !== undefined) {
						patch.isActive = input.isActive;
					}
					if (input.secretCiphertext !== undefined) {
						patch.secretCiphertext = input.secretCiphertext;
					}
					if (input.secretHint !== undefined) {
						patch.secretHint = input.secretHint;
					}

					const [row] = await dbActive(db)
						.update(dataSource)
						.set(patch)
						.where(eq(dataSource.id, input.id))
						.returning();
					return (row as TDataSourceRow | undefined) ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const remove: TDataSourceRepo["remove"] = (id) =>
			Effect.tryPromise({
				try: async () => {
					const rows = await dbActive(db)
						.delete(dataSource)
						.where(eq(dataSource.id, id))
						.returning({ id: dataSource.id });
					return rows.length > 0;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		return DataSourceRepo.of({
			list,
			findById,
			findByName,
			create,
			update,
			remove,
		});
	}),
).pipe(Layer.provide(dbServiceLayer));
