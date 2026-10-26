import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { execSync } from "node:child_process";

import {
	ADMIN_DATABASE_URL,
	API_PORT,
	E2E_DATABASE_URL,
	apiEnv,
} from "./services.ts";

const HEALTH_URL = `http://127.0.0.1:${API_PORT}/healthz`;
const REPO_ROOT = new URL("../../..", import.meta.url).pathname;
const PSQL_AVAILABLE = spawnSync("psql", ["--version"]).status === 0;
const DOCKER_PSQL =
	"docker compose -f docker-compose.dev.yml exec -T postgres psql -U app -d postgres";

let apiProcess: ChildProcess | undefined;
let workerProcess: ChildProcess | undefined;
const WORKER_START_MS = 1_000;

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

const databaseReset = (databaseName: string): void => {
	const statement = `DROP DATABASE IF EXISTS ${databaseName} WITH (FORCE)`;
	const create = `CREATE DATABASE ${databaseName}`;

	if (PSQL_AVAILABLE) {
		execSync(`psql "${ADMIN_DATABASE_URL}" -c "${statement}" -c "${create}"`, {
			stdio: "ignore",
		});
		return;
	}

	execSync(
		`${DOCKER_PSQL} -c "${statement}" -c "${create}"`,
		{ cwd: REPO_ROOT, stdio: "ignore" },
	);
};

export const setup = async (): Promise<void> => {
	const dbName = new URL(E2E_DATABASE_URL).pathname.slice(1);
	databaseReset(dbName);

	execSync("pnpm --filter @app/api run migrate", {
		cwd: REPO_ROOT,
		env,
		stdio: "inherit",
	});

	execSync("pnpm --filter @app/api run db:seed", {
		cwd: REPO_ROOT,
		env,
		stdio: "inherit",
	});

	apiProcess = spawn(
		"pnpm",
		["--filter", "@app/api", "exec", "tsx", "src/main.ts"],
		{
			cwd: REPO_ROOT,
			env,
			stdio: "inherit",
			detached: true,
		},
	);

	await waitForHealth();

	workerProcess = spawn(
		"pnpm",
		["--filter", "@app/api", "exec", "tsx", "src/worker/run.ts"],
		{
			cwd: REPO_ROOT,
			env,
			stdio: "inherit",
			detached: true,
		},
	);

	await new Promise((resolve) => setTimeout(resolve, WORKER_START_MS));
};

export const teardown = (): void => {
	for (const pid of [workerProcess?.pid, apiProcess?.pid]) {
		if (pid === undefined) {
			continue;
		}

		try {
			process.kill(-pid);
		} catch {}
	}
};
