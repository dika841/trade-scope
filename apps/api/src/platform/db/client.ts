import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import {
	drizzle as drizzleNode,
	type NodePgDatabase,
} from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool as NodePool } from "pg";
import ws from "ws";
import {
	DATABASE_DRIVER,
	type TDatabaseDriver,
} from "#/platform/config/drivers.ts";
import * as schema from "#/platform/db/schema.ts";

export { DATABASE_DRIVER, type TDatabaseDriver };

export const DB_CONNECTION_TIMEOUT_MS = 5_000;
export const DB_STATEMENT_TIMEOUT_MS = 30_000;

/**
 * The repositories only use operations shared by every Postgres driver, so the
 * workspace depends on the portable PgDatabase type rather than on one driver's
 * concrete class. Local development and CI use node-postgres; Neon is selected
 * with DATABASE_DRIVER=neon in serverless environments.
 */
export type TDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export type TDbHandle = {
	readonly db: TDb;
	readonly close: () => Promise<void>;
};

// Neon's serverless driver speaks WebSocket. Node 22+ has a global WebSocket,
// but passing the ws implementation keeps the behaviour explicit and works on
// the Alpine image used by the production container.
neonConfig.webSocketConstructor = ws;

const dbNodeCreate = (databaseUrl: string): TDbHandle => {
	const pool = new NodePool({
		connectionString: databaseUrl,
		connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
		statement_timeout: DB_STATEMENT_TIMEOUT_MS,
		query_timeout: DB_STATEMENT_TIMEOUT_MS,
	});

	const db = drizzleNode(pool, { schema }) as NodePgDatabase<typeof schema>;

	return {
		db: db as unknown as TDb,
		close: (): Promise<void> => pool.end(),
	};
};

const dbNeonCreate = (databaseUrl: string): TDbHandle => {
	const pool = new NeonPool({
		connectionString: databaseUrl,
		connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
		max: 10,
		options: `-c statement_timeout=${DB_STATEMENT_TIMEOUT_MS}`,
	});

	return {
		db: drizzleNeon(pool, { schema }) as unknown as TDb,
		close: (): Promise<void> => pool.end(),
	};
};

export const dbCreate = (
	databaseUrl: string,
	driver: TDatabaseDriver,
): TDbHandle =>
	driver === DATABASE_DRIVER.NEON
		? dbNeonCreate(databaseUrl)
		: dbNodeCreate(databaseUrl);
