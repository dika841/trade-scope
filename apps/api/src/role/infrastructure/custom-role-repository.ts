import { A, D } from "@mobily/ts-belt";
import { count, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { EDatabase } from "#/shared/errors.ts";
import {
	CustomRoleRepo,
	type TCustomRoleRepo,
	type TCustomRoleRow,
} from "#/role/domain/custom-role.ts";
import { DbService, dbServiceLayer } from "#/platform/db/db-service.ts";
import { dbActive } from "#/platform/db/transaction.ts";
import { customRole } from "#/platform/db/tables/custom-role.ts";
import { user } from "#/platform/db/tables/auth.ts";

export const customRoleRepoLayer = Layer.effect(
	CustomRoleRepo,
	Effect.gen(function* () {
		const { db } = yield* DbService;

		const memberCounts: TCustomRoleRepo["memberCounts"] = () =>
			Effect.tryPromise({
				try: async () => {
					const rows = await dbActive(db)
						.select({ role: user.role, value: count() })
						.from(user)
						.groupBy(user.role);
					return D.fromPairs(
						A.map(rows, (row) => [row.role, row.value] as const),
					);
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const list: TCustomRoleRepo["list"] = () =>
			Effect.tryPromise({
				try: () =>
					dbActive(db).select().from(customRole).orderBy(customRole.label),
				catch: (cause) => new EDatabase({ cause }),
			});

		const findByKey: TCustomRoleRepo["findByKey"] = (key) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select()
						.from(customRole)
						.where(eq(customRole.key, key))
						.limit(1);
					return row ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const create: TCustomRoleRepo["create"] = (
			{ key, label, description, permissions },
			createdBy,
		) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.insert(customRole)
						.values({
							key,
							label,
							description: description ?? null,
							permissions,
							createdBy,
						})
						.returning();
					return row as TCustomRoleRow;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const update: TCustomRoleRepo["update"] = ({ key, ...patch }) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.update(customRole)
						.set(D.merge(patch, { updatedAt: new Date() }))
						.where(eq(customRole.key, key))
						.returning();
					return row ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const remove: TCustomRoleRepo["remove"] = (key) =>
			Effect.tryPromise({
				try: async () => {
					const result = await dbActive(db)
						.delete(customRole)
						.where(eq(customRole.key, key))
						.returning({ id: customRole.id });
					return result.length > 0;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		return CustomRoleRepo.of({
			memberCounts,
			list,
			findByKey,
			create,
			update,
			remove,
		});
	}),
).pipe(Layer.provide(dbServiceLayer));
