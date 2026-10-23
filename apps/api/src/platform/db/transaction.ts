import { AsyncLocalStorage } from "node:async_hooks";
import { Effect, Exit, type Context } from "effect";
import { match, P } from "ts-pattern";
import type { TDb } from "#/platform/db/client.ts";
import { DbService, type TDbServiceId } from "#/platform/db/db-service.ts";
import { EDatabase } from "#/shared/errors.ts";

const ROLLBACK_TAG = "app/TransactionRollback";

type TRollback = {
	readonly tag: typeof ROLLBACK_TAG;
	readonly exit: unknown;
};

const transactionStorage = new AsyncLocalStorage<TDb>();

export const dbActive = (db: TDb): TDb => transactionStorage.getStore() ?? db;

export const dbActiveProxy = (db: TDb): TDb =>
	new Proxy(db, {
		get: (_target, property): unknown => {
			const active = dbActive(db) as unknown as Record<
				string | symbol,
				unknown
			>;
			const value = active[property];

			return match(typeof value)
				.with("function", (): unknown => (value as () => unknown).bind(active))
				.otherwise((): unknown => value);
		},
	});

const rollbackOf = (exit: unknown): TRollback => ({ tag: ROLLBACK_TAG, exit });

const isRollback = (cause: unknown): cause is TRollback =>
	typeof cause === "object" &&
	cause !== null &&
	(cause as TRollback).tag === ROLLBACK_TAG;

const transactionRun = async <A, E, R>(
	db: TDb,
	services: Context.Context<R>,
	effect: Effect.Effect<A, E, R>,
): Promise<Exit.Exit<A, E>> => {
	try {
		return await db.transaction(async (tx): Promise<Exit.Exit<A, E>> => {
			const exit = await transactionStorage.run(tx as TDb, () =>
				Effect.runPromiseExitWith(services)(effect),
			);

			return match(Exit.isFailure(exit))
				.with(true, (): Exit.Exit<A, E> => {
					throw rollbackOf(exit);
				})
				.otherwise((): Exit.Exit<A, E> => exit);
		});
	} catch (cause) {
		return match(cause)
			.when(
				isRollback,
				(found): Exit.Exit<A, E> => found.exit as Exit.Exit<A, E>,
			)
			.otherwise((): never => {
				throw cause;
			});
	}
};

export const transactional = <A, E, R>(
	effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E | EDatabase, R | TDbServiceId> =>
	Effect.gen(function* () {
		const { db } = yield* DbService;
		const services = yield* Effect.context<R>();

		const exit = yield* Effect.tryPromise({
			try: () => transactionRun(db, services, effect),
			catch: (cause) => new EDatabase({ cause }),
		});

		return yield* exit;
	});

export const isInTransaction = (): boolean =>
	match(transactionStorage.getStore())
		.with(P.nullish, (): boolean => false)
		.otherwise((): boolean => true);
