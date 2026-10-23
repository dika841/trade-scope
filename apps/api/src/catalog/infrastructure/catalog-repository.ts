import type { TCatalogProductInput } from "@app/schemas";
import { and, asc, eq, exists, like, or } from "drizzle-orm";
import { Effect, Layer } from "effect";
import {
	CatalogRepo,
	type TCatalogRepo,
	type TCatalogProductRow,
	type TCatalogSearchRows,
} from "#/catalog/domain/catalog.ts";
import { DbService, dbServiceLayer } from "#/platform/db/db-service.ts";
import { containsWhere, likeEscape } from "#/platform/db/search.ts";
import { dbActive } from "#/platform/db/transaction.ts";
import { hsAlias, hsProduct } from "#/platform/db/tables/catalog.ts";
import { EDatabase } from "#/shared/errors.ts";

const digitsOf = (value: string): string => value.replace(/[^0-9]/g, "");

export const catalogRepoLayer = Layer.effect(
	CatalogRepo,
	Effect.gen(function* () {
		const { db } = yield* DbService;

		const search: TCatalogRepo["search"] = (input) =>
			Effect.tryPromise({
				try: async (): Promise<TCatalogSearchRows> => {
					const connection = dbActive(db);
					const term = input.q.trim();
					const codeTerm = digitsOf(term);

					const aliasMatch = exists(
						connection
							.select({ id: hsAlias.id })
							.from(hsAlias)
							.where(
								and(
									eq(hsAlias.hsProductId, hsProduct.id),
									containsWhere(hsAlias.alias, term),
								),
							),
					);

					const textMatch = or(
						containsWhere(hsProduct.description, term),
						aliasMatch,
					);

					const where =
						codeTerm.length === 0
							? textMatch
							: or(
									like(hsProduct.hsCode, `${likeEscape(codeTerm)}%`),
									textMatch,
								);

					const rows = await connection
						.select()
						.from(hsProduct)
						.where(where)
						.orderBy(asc(hsProduct.hsCode), asc(hsProduct.hsRevision))
						.limit(input.limit + 1);

					return {
						items: rows.slice(0, input.limit) as TCatalogProductRow[],
						hasMore: rows.length > input.limit,
					};
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const findByCode: TCatalogRepo["findByCode"] = (
			input: TCatalogProductInput,
		) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select()
						.from(hsProduct)
						.where(
							and(
								eq(hsProduct.hsCode, digitsOf(input.hsCode)),
								eq(hsProduct.hsRevision, input.revision),
							),
						)
						.limit(1);

					return (row as TCatalogProductRow | undefined) ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const listAliases: TCatalogRepo["listAliases"] = (hsProductId) =>
			Effect.tryPromise({
				try: async () => {
					const rows = await dbActive(db)
						.select({ alias: hsAlias.alias })
						.from(hsAlias)
						.where(eq(hsAlias.hsProductId, hsProductId))
						.orderBy(asc(hsAlias.alias));

					return rows.map((row) => row.alias);
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		return CatalogRepo.of({ search, findByCode, listAliases });
	}),
).pipe(Layer.provide(dbServiceLayer));
