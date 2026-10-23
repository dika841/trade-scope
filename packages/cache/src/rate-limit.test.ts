import { describe, expect, it } from "vitest";
import { cacheClientFake } from "./cache-client-fake.ts";
import { rateLimitCheck } from "./rate-limit.ts";

const INPUT = {
	identifier: "203.0.113.7",
	scope: "auth",
	windowSeconds: 60,
	max: 2,
};

describe("rateLimitCheck", () => {
	it("allows requests up to the maximum and denies the next one", async () => {
		const client = cacheClientFake();

		await expect(rateLimitCheck(client, INPUT)).resolves.toMatchObject({
			allowed: true,
			count: 1,
			remaining: 1,
		});
		await expect(rateLimitCheck(client, INPUT)).resolves.toMatchObject({
			allowed: true,
			count: 2,
			remaining: 0,
		});
		await expect(rateLimitCheck(client, INPUT)).resolves.toMatchObject({
			allowed: false,
			count: 3,
			remaining: 0,
		});
	});

	it("sets the window expiry only on the first hit", async () => {
		const client = cacheClientFake();

		await rateLimitCheck(client, INPUT);
		const key = "rate-limit:auth:203.0.113.7";
		expect(client.expiries.get(key)).toBe(60);

		client.expiries.delete(key);
		await rateLimitCheck(client, INPUT);
		expect(client.expiries.has(key)).toBe(false);
	});

	it("keeps separate buckets per identifier", async () => {
		const client = cacheClientFake();

		await rateLimitCheck(client, INPUT);
		await rateLimitCheck(client, INPUT);
		await rateLimitCheck(client, INPUT);

		await expect(
			rateLimitCheck(client, { ...INPUT, identifier: "198.51.100.4" }),
		).resolves.toMatchObject({ allowed: true, count: 1 });
	});
});
