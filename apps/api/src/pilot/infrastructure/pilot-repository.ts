import {
	type TPilotListInput,
	type TPilotStatus,
	PILOT_SORT,
} from "@app/schemas";
import { and, asc, count, eq, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Effect, Layer } from "effect";
import {
	PilotRepo,
	type TPilotRepo,
	type TPilotRow,
} from "#/pilot/domain/pilot.ts";
import { DbService, dbServiceLayer } from "#/platform/db/db-service.ts";
import { offsetFor, orderFor } from "#/shared/pagination.ts";
import { dbActive } from "#/platform/db/transaction.ts";
import { user } from "#/platform/db/tables/auth.ts";
import { country, hsProduct } from "#/platform/db/tables/catalog.ts";
import { pilotRequest } from "#/platform/db/tables/pilot.ts";
import { EDatabase } from "#/shared/errors.ts";

const ownerUser = alias(user, "pilot_owner");
const creatorUser = alias(user, "pilot_creator");

const digitsOf = (value: string): string => value.replace(/[^0-9]/g, "");

const rowColumns = {
	id: pilotRequest.id,
	hsCode: pilotRequest.hsCode,
	hsRevision: pilotRequest.hsRevision,
	productDescription: hsProduct.description,
	marketIso2: pilotRequest.marketIso2,
	marketName: country.name,
	status: pilotRequest.status,
	ownerId: pilotRequest.ownerId,
	ownerName: ownerUser.name,
	ownerEmail: ownerUser.email,
	notes: pilotRequest.notes,
	createdBy: pilotRequest.createdBy,
	createdByEmail: creatorUser.email,
	createdAt: pilotRequest.createdAt,
	updatedAt: pilotRequest.updatedAt,
} as const;

const whereOf = (input: TPilotListInput): SQL | undefined =>
	and(
		input.status === undefined
			? undefined
			: eq(pilotRequest.status, input.status),
		input.hsCode === undefined
			? undefined
			: eq(pilotRequest.hsCode, digitsOf(input.hsCode)),
		input.hsRevision === undefined
			? undefined
			: eq(pilotRequest.hsRevision, input.hsRevision),
		input.marketIso2 === undefined
			? undefined
			: eq(pilotRequest.marketIso2, input.marketIso2.toUpperCase()),
	);

export const pilotRepoLayer = Layer.effect(
	PilotRepo,
	Effect.gen(function* () {
		const { db } = yield* DbService;

		const selectRows = () =>
			dbActive(db)
				.select(rowColumns)
				.from(pilotRequest)
				.leftJoin(
					hsProduct,
					and(
						eq(hsProduct.hsCode, pilotRequest.hsCode),
						eq(hsProduct.hsRevision, pilotRequest.hsRevision),
					),
				)
				.leftJoin(country, eq(country.iso2, pilotRequest.marketIso2))
				.leftJoin(ownerUser, eq(ownerUser.id, pilotRequest.ownerId))
				.leftJoin(creatorUser, eq(creatorUser.id, pilotRequest.createdBy));

		const rowById = async (id: string): Promise<TPilotRow | null> => {
			const [row] = await selectRows().where(eq(pilotRequest.id, id)).limit(1);

			return (row as TPilotRow | undefined) ?? null;
		};

		const list: TPilotRepo["list"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const where = whereOf(input);
					const sortColumn =
						input.sortBy === PILOT_SORT.STATUS
							? pilotRequest.status
							: pilotRequest.createdAt;

					const [rows, [totalRow]] = await Promise.all([
						selectRows()
							.where(where)
							.orderBy(orderFor(sortColumn, input.sortDir))
							.limit(input.pageSize)
							.offset(offsetFor(input)),
						dbActive(db)
							.select({ value: count() })
							.from(pilotRequest)
							.where(where),
					]);

					return {
						items: rows as TPilotRow[],
						total: totalRow?.value ?? 0,
					};
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const getById: TPilotRepo["getById"] = (id) =>
			Effect.tryPromise({
				try: () => rowById(id),
				catch: (cause) => new EDatabase({ cause }),
			});

		const listForProduct: TPilotRepo["listForProduct"] = (hsCode, hsRevision) =>
			Effect.tryPromise({
				try: async () => {
					const rows = await selectRows()
						.where(
							and(
								eq(pilotRequest.hsCode, digitsOf(hsCode)),
								eq(pilotRequest.hsRevision, hsRevision),
							),
						)
						.orderBy(asc(pilotRequest.createdAt));

					return rows as TPilotRow[];
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const create: TPilotRepo["create"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const [created] = await dbActive(db)
						.insert(pilotRequest)
						.values({
							hsCode: digitsOf(input.hsCode),
							hsRevision: input.hsRevision,
							marketIso2: input.marketIso2.toUpperCase(),
							status: "new",
							ownerId: input.ownerId ?? null,
							notes: input.notes ?? null,
							createdBy: input.createdBy,
						})
						.returning({ id: pilotRequest.id });

					if (created === undefined) {
						throw new Error("pilot insert returned no row");
					}

					const row = await rowById(created.id);

					if (row === null) {
						throw new Error("pilot insert could not be read back");
					}

					return row;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const update: TPilotRepo["update"] = (input) =>
			Effect.tryPromise({
				try: async () => {
					const patch: {
						updatedAt: Date;
						status?: TPilotStatus;
						ownerId?: string | null;
						notes?: string | null;
					} = { updatedAt: new Date() };

					if (input.status !== undefined) {
						patch.status = input.status;
					}

					if (input.ownerId !== undefined) {
						patch.ownerId = input.ownerId;
					}

					if (input.notes !== undefined) {
						patch.notes = input.notes;
					}

					const [updated] = await dbActive(db)
						.update(pilotRequest)
						.set(patch)
						.where(eq(pilotRequest.id, input.id))
						.returning({ id: pilotRequest.id });

					if (updated === undefined) {
						return null;
					}

					return rowById(updated.id);
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const findProduct: TPilotRepo["findProduct"] = (hsCode, hsRevision) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select({
							hsCode: hsProduct.hsCode,
							hsRevision: hsProduct.hsRevision,
						})
						.from(hsProduct)
						.where(
							and(
								eq(hsProduct.hsCode, digitsOf(hsCode)),
								eq(hsProduct.hsRevision, hsRevision),
							),
						)
						.limit(1);

					return row ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const findMarket: TPilotRepo["findMarket"] = (iso2) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select({ iso2: country.iso2, name: country.name })
						.from(country)
						.where(eq(country.iso2, iso2.toUpperCase()))
						.limit(1);

					return row ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const findOwner: TPilotRepo["findOwner"] = (id) =>
			Effect.tryPromise({
				try: async () => {
					const [row] = await dbActive(db)
						.select({ id: user.id, name: user.name, email: user.email })
						.from(user)
						.where(eq(user.id, id))
						.limit(1);

					return row ?? null;
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		const listOwners: TPilotRepo["listOwners"] = () =>
			Effect.tryPromise({
				try: async () =>
					dbActive(db)
						.select({ id: user.id, name: user.name, email: user.email })
						.from(user)
						.orderBy(asc(user.name)),
				catch: (cause) => new EDatabase({ cause }),
			});

		const listMarkets: TPilotRepo["listMarkets"] = () =>
			Effect.tryPromise({
				try: async () =>
					dbActive(db)
						.select({ iso2: country.iso2, name: country.name })
						.from(country)
						.where(eq(country.isActive, true))
						.orderBy(asc(country.name)),
				catch: (cause) => new EDatabase({ cause }),
			});

		return PilotRepo.of({
			list,
			getById,
			listForProduct,
			create,
			update,
			findProduct,
			findMarket,
			findOwner,
			listOwners,
			listMarkets,
		});
	}),
).pipe(Layer.provide(dbServiceLayer));
