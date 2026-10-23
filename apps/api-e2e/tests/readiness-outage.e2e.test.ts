import { spawn, type ChildProcess } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";
import { apiEnv } from "../support/services.ts";

const OUTAGE_PORT = 3108;
const UNREACHABLE_REDIS = "redis://127.0.0.1:6399";
const LIVENESS = `http://127.0.0.1:${OUTAGE_PORT}/healthz`;
const READINESS = `http://127.0.0.1:${OUTAGE_PORT}/ready`;
const POLL_MS = 300;
const DEADLINE_MS = 20_000;

let apiProcess: ChildProcess | undefined;

const waitForLiveness = async (): Promise<void> => {
	const deadline = Date.now() + DEADLINE_MS;

	while (Date.now() < deadline) {
		const alive = await fetch(LIVENESS)
			.then((response) => response.ok)
			.catch(() => false);

		if (alive) {
			return;
		}

		await new Promise((resolve) => setTimeout(resolve, POLL_MS));
	}

	throw new Error(`api with a dead cache never became live at ${LIVENESS}`);
};

afterAll((): void => {
	const pid = apiProcess?.pid;

	if (pid !== undefined) {
		try {
			process.kill(-pid);
		} catch {}
	}
});

describe("readiness under a dependency outage", () => {
	it("stays live but refuses traffic, naming the dependency that is down", async (): Promise<void> => {
		apiProcess = spawn(
			"pnpm",
			["--filter", "@app/api", "exec", "tsx", "src/main.ts"],
			{
				cwd: new URL("../../..", import.meta.url).pathname,
				env: apiEnv({
					PORT: String(OUTAGE_PORT),
					REDIS_URL: UNREACHABLE_REDIS,
					BETTER_AUTH_URL: `http://127.0.0.1:${OUTAGE_PORT}`,
				}),
				stdio: "ignore",
				detached: true,
			},
		);

		await waitForLiveness();

		const readiness = await fetch(READINESS);
		expect(readiness.status).toBe(503);

		const body = (await readiness.json()) as {
			status: string;
			dependencies: { name: string; status: string }[];
		};

		expect(body.status).toBe("not-ready");
		expect(body.dependencies).toContainEqual({
			name: "cache",
			status: "down",
		});
		expect(body.dependencies).toContainEqual({
			name: "database",
			status: "up",
		});
	});
});
