import { execSync, spawn, type ChildProcess } from "node:child_process";

const API_PORT = 3108;
const API_URL = `http://127.0.0.1:${API_PORT}`;
const BASE_DATABASE_URL =
	process.env.DATABASE_URL ?? "postgres://app:app@localhost:5432/app";
const DATABASE_URL = BASE_DATABASE_URL.replace(/\/[^/]+$/, "/app_web_e2e");

let apiProcess: ChildProcess | undefined;

const env = {
	...process.env,
	NODE_ENV: "test",
	PORT: String(API_PORT),
	DATABASE_URL,
	REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
	RABBITMQ_URL: process.env.RABBITMQ_URL ?? "amqp://app:app@localhost:5672",
	RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ?? "10000",
	BETTER_AUTH_URL: API_URL,
	BETTER_AUTH_SECRET: "web-e2e-test-secret-please-do-not-use-in-prod",
	WEB_ORIGIN: "http://127.0.0.1:5273",
};

const waitForHealth = async (timeoutMs = 15_000): Promise<void> => {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(`${API_URL}/healthz`);
			if (response.ok) {
				return;
			}
		} catch {}
		await new Promise((resolve) => setTimeout(resolve, 300));
	}
	throw new Error("API did not become healthy in time for web-e2e");
};

const globalSetup = async (): Promise<void> => {
	const dbName = new URL(DATABASE_URL).pathname.slice(1);
	const adminUrl = BASE_DATABASE_URL.replace(/\/[^/]+$/, "/postgres");

	execSync(
		`psql "${adminUrl}" -c "DROP DATABASE IF EXISTS ${dbName}" -c "CREATE DATABASE ${dbName}"`,
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

	apiProcess = spawn(
		"pnpm",
		["--filter", "@app/api", "exec", "tsx", "src/main.ts"],
		{
			cwd: new URL("../../..", import.meta.url).pathname,
			env,
			stdio: "inherit",
			detached: true,
		},
	);

	await waitForHealth();

	process.env.__WEB_E2E_API_PID__ = String(apiProcess.pid);
};

export default globalSetup;
