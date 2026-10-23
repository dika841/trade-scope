import { spawn, type ChildProcess } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";
import { apiEnv } from "../support/services.ts";
import { SEED_CREDENTIALS, signIn } from "../support/sign-in.ts";

const OUTAGE_PORT = 3109;
const UNREACHABLE_DATABASE = "postgres://app:app@127.0.0.1:5499/app";
const LIVENESS = `http://127.0.0.1:${OUTAGE_PORT}/healthz`;
const ME = `http://127.0.0.1:${OUTAGE_PORT}/api/me`;
const POLL_MS = 300;
const DEADLINE_MS = 20_000;

const HTTP_UNAUTHORIZED = 401;
const HTTP_SERVICE_UNAVAILABLE = 503;

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

	throw new Error(`api with a dead database never became live at ${LIVENESS}`);
};

afterAll((): void => {
	const pid = apiProcess?.pid;

	if (pid !== undefined) {
		try {
			process.kill(-pid);
		} catch {}
	}
});

describe("session resolution under a database outage", () => {
	it("answers 503 for a genuinely signed-in caller rather than reporting them signed out", async (): Promise<void> => {
		apiProcess = spawn(
			"pnpm",
			["--filter", "@app/api", "exec", "tsx", "src/main.ts"],
			{
				cwd: new URL("../../..", import.meta.url).pathname,
				env: apiEnv({
					PORT: String(OUTAGE_PORT),
					DATABASE_URL: UNREACHABLE_DATABASE,
					BETTER_AUTH_URL: `http://127.0.0.1:${OUTAGE_PORT}`,
				}),
				stdio: "ignore",
				detached: true,
			},
		);

		await waitForLiveness();

		const cookie = await signIn(SEED_CREDENTIALS.admin);

		const response = await fetch(ME, { headers: { cookie } });

		expect(response.status).toBe(HTTP_SERVICE_UNAVAILABLE);
		expect(response.status).not.toBe(HTTP_UNAUTHORIZED);
	});

	it("still reports a caller with no cookie as signed out", async (): Promise<void> => {
		const response = await fetch(ME);

		expect(response.status).toBe(HTTP_UNAUTHORIZED);
	});
});
