import { spawn, type ChildProcess } from "node:child_process";
import { execSync } from "node:child_process";
import { match, P } from "ts-pattern";

import {
	ADMIN_DATABASE_URL,
	API_PORT,
	E2E_DATABASE_URL,
	apiEnv,
} from "./services.ts";

const HEALTH_URL = `http://127.0.0.1:${API_PORT}/healthz`;

let apiProcess: ChildProcess | undefined;

const waitForHealth = async (timeoutMs = 15_000): Promise<void> => {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(HEALTH_URL);
			if (response.ok) {
				return;
			}
		} catch {}
		await new Promise((resolve) => setTimeout(resolve, 300));
	}
	throw new Error(`API did not become healthy at ${HEALTH_URL} within ${timeoutMs}ms`);
};

const env = apiEnv({});

export const setup = async (): Promise<void> => {
	const dbName = new URL(E2E_DATABASE_URL).pathname.slice(1);
	execSync(
		`psql "${ADMIN_DATABASE_URL}" -c "DROP DATABASE IF EXISTS ${dbName}" -c "CREATE DATABASE ${dbName}"`,
		{ stdio: "ignore" },
	);

	execSync("pnpm --filter @app/api run migrate", {
		cwd: new URL("../../..", import.meta.url).pathname,
		env,
		stdio: "inherit",
	});

	execSync("pnpm --filter @app/api run db:seed", {
		cwd: new URL("../../..", import.meta.url).pathname,
		env,
		stdio: "inherit",
	});

	apiProcess = spawn("pnpm", ["--filter", "@app/api", "exec", "tsx", "src/main.ts"], {
		cwd: new URL("../../..", import.meta.url).pathname,
		env,
		stdio: "inherit",
		detached: true,
	});

	await waitForHealth();
};

export const teardown = (): void => {
	match(apiProcess?.pid)
		.with(P.nullish, () => undefined)
		.otherwise((pid) => {
			try {
				process.kill(-pid);
			} catch {}
		});
};
