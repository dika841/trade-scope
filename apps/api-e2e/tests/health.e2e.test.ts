import { DEPENDENCY, DEPENDENCY_STATUS, HEALTH_STATUS } from "@app/schemas";
import { APP_VERSION } from "@app/version";
import { describe, expect, it } from "vitest";
import { BASE_URL, client } from "../support/client.ts";

describe("health", () => {
	it("reports ok with the centralized version", async (): Promise<void> => {
		const result = await client.health.check();
		expect(result.status).toBe(HEALTH_STATUS.OK);
		expect(result.version).toBe(APP_VERSION);
	});

	it("reports every dependency as up on /ready with a real stack behind it", async (): Promise<void> => {
		const response = await fetch(`${BASE_URL}/ready`);
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			status: string;
			version: string;
			dependencies: { name: string; status: string }[];
		};

		expect(body.status).toBe(HEALTH_STATUS.READY);
		expect(body.version).toBe(APP_VERSION);
		expect(body.dependencies).toContainEqual({
			name: DEPENDENCY.DATABASE,
			status: DEPENDENCY_STATUS.UP,
		});
		expect(body.dependencies).toContainEqual({
			name: DEPENDENCY.CACHE,
			status: DEPENDENCY_STATUS.UP,
		});
	});
});
