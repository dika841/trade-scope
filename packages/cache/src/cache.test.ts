import { describe, expect, it } from "vitest";
import { cacheClientFake } from "./cache-client-fake.ts";
import { cacheCreate, type TDecoder } from "./cache.ts";

type TGrant = { permissions: readonly string[] };

const KEY = "role:admin";
const TTL_SECONDS = 60;

const isGrant = (value: unknown): value is TGrant =>
	typeof value === "object" &&
	value !== null &&
	Array.isArray((value as { permissions?: unknown }).permissions);

const grantDecode: TDecoder<TGrant> = (value) =>
	isGrant(value) ? value : null;

describe("cacheCreate", () => {
	it("returns null for a key that was never written", async () => {
		const cache = cacheCreate(cacheClientFake());

		await expect(cache.get(KEY, grantDecode)).resolves.toBeNull();
	});

	it("round-trips a structured value and records its ttl", async () => {
		const client = cacheClientFake();
		const cache = cacheCreate(client);

		await cache.set(KEY, { permissions: ["user:manage"] }, TTL_SECONDS);

		await expect(cache.get(KEY, grantDecode)).resolves.toEqual({
			permissions: ["user:manage"],
		});
		expect(client.expiries.get(KEY)).toBe(TTL_SECONDS);
	});

	it("returns null once a key is deleted", async () => {
		const cache = cacheCreate(cacheClientFake());

		await cache.set(KEY, { permissions: [] }, TTL_SECONDS);
		await cache.del(KEY);

		await expect(cache.get(KEY, grantDecode)).resolves.toBeNull();
	});

	it("treats a value the decoder rejects as a miss rather than trusting it", async () => {
		const cache = cacheCreate(cacheClientFake());

		await cache.set(KEY, { somethingElse: true }, TTL_SECONDS);

		await expect(cache.get(KEY, grantDecode)).resolves.toBeNull();
	});

	it("treats a stored value that is not JSON as a miss", async () => {
		const client = cacheClientFake();
		const cache = cacheCreate(client);

		await client.setex(KEY, TTL_SECONDS, "{ not json");

		await expect(cache.get(KEY, grantDecode)).resolves.toBeNull();
	});
});
