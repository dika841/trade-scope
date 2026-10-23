import { migrationsRun } from "@app/migrations";
import { env } from "#/platform/config/env.ts";

await migrationsRun({
	service: "api",
	migrationsFolder: new URL("../../drizzle", import.meta.url).pathname,
	databaseUrl: env.DATABASE_URL,
});
