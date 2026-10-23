import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import type { TDb } from "#/platform/db/client.ts";
import { DbService } from "#/platform/db/db-service.ts";
import {
	dbActive,
	dbActiveProxy,
	transactional,
} from "#/platform/db/transaction.ts";
import { ENotFound } from "#/shared/errors.ts";

const TX = { marker: "transaction" } as unknown as TDb;
const VALUE = 7;
const MESSAGE = "gone";

type TDbFake = {
	db: TDb;
	state: { committed: boolean; rolledBack: boolean };
};

const dbFake = (): TDbFake => {
	const state = { committed: false, rolledBack: false };

	const db = {
		transaction: async <T>(run: (tx: TDb) => Promise<T>): Promise<T> => {
			try {
				const result = await run(TX);
				state.committed = true;
				return result;
			} catch (cause) {
				state.rolledBack = true;
				throw cause;
			}
		},
	} as unknown as TDb;

	return { db, state };
};

const layerFor = (db: TDb): Layer.Layer<typeof DbService.Identifier> =>
	Layer.succeed(DbService, DbService.of({ db }));

describe("transactional", () => {
	it("commits and returns the value when the program succeeds", async (): Promise<void> => {
		const fake = dbFake();

		const result = await Effect.runPromise(
			transactional(Effect.succeed(VALUE)).pipe(
				Effect.provide(layerFor(fake.db)),
			),
		);

		expect(result).toBe(VALUE);
		expect(fake.state.committed).toBe(true);
		expect(fake.state.rolledBack).toBe(false);
	});

	it("rolls back when the program fails", async (): Promise<void> => {
		const fake = dbFake();

		await Effect.runPromise(
			transactional(Effect.fail(new ENotFound({ message: MESSAGE }))).pipe(
				Effect.provide(layerFor(fake.db)),
				Effect.catch(() => Effect.succeed(undefined)),
			),
		);

		expect(fake.state.rolledBack).toBe(true);
		expect(fake.state.committed).toBe(false);
	});

	it("re-raises the original typed error rather than swallowing it", async (): Promise<void> => {
		const fake = dbFake();

		const error = await Effect.runPromise(
			transactional(Effect.fail(new ENotFound({ message: MESSAGE }))).pipe(
				Effect.provide(layerFor(fake.db)),
				Effect.catch((found) => Effect.succeed(found)),
			),
		);

		expect(error).toBeInstanceOf(ENotFound);
		expect(error).toMatchObject({ message: MESSAGE });
	});

	it("hands repositories the transaction while one is open", async (): Promise<void> => {
		const fake = dbFake();

		const seen = await Effect.runPromise(
			transactional(Effect.sync(() => dbActive(fake.db))).pipe(
				Effect.provide(layerFor(fake.db)),
			),
		);

		expect(seen).toBe(TX);
	});

	it("hands repositories the pool when no transaction is open", (): void => {
		const fake = dbFake();

		expect(dbActive(fake.db)).toBe(fake.db);
	});
});

describe("dbActiveProxy", () => {
	it("forwards a property to the pool when no transaction is open", (): void => {
		const pool = { marker: "pool" } as unknown as TDb;
		const proxied = dbActiveProxy(pool) as unknown as { marker: string };

		expect(proxied.marker).toBe("pool");
	});

	it("forwards a property to the transaction while one is open", async (): Promise<void> => {
		const fake = dbFake();
		const proxied = dbActiveProxy(fake.db) as unknown as { marker: string };

		const seen = await Effect.runPromise(
			transactional(Effect.sync(() => proxied.marker)).pipe(
				Effect.provide(layerFor(fake.db)),
			),
		);

		expect(seen).toBe("transaction");
	});

	it("binds a forwarded method to the connection it came from", async (): Promise<void> => {
		const pool = {
			marker: "pool",
			where: function (this: { marker: string }): string {
				return this.marker;
			},
		} as unknown as TDb;
		const proxied = dbActiveProxy(pool) as unknown as { where: () => string };

		expect(proxied.where()).toBe("pool");
	});
});
