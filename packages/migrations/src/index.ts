import { loggerCreate } from "@app/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

type TRunMigrationsOptions = {
	service: string;
	migrationsFolder: string;
	databaseUrl: string;
};

export const migrationsRun = async ({
	service,
	migrationsFolder,
	databaseUrl,
}: TRunMigrationsOptions): Promise<void> => {
	const logger = loggerCreate({
		service,
		env: process.env.NODE_ENV ?? "development",
	});
	const pool = new Pool({ connectionString: databaseUrl });
	const db = drizzle(pool);

	try {
		logger.info({ migrationsFolder }, "running migrations");
		await migrate(db, { migrationsFolder });
		logger.info("migrations applied");
	} finally {
		await pool.end();
	}
};
