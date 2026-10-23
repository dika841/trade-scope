import { describe, expect, it } from "vitest";
import { REDIS_DRIVER } from "#/platform/config/drivers.ts";
import { cacheConnectionCreate } from "#/platform/cache/redis.ts";

describe("cacheConnectionCreate", () => {
	it("builds an Upstash client without opening a connection", async (): Promise<void> => {
		const connection = cacheConnectionCreate({
			driver: REDIS_DRIVER.UPSTASH,
			upstashUrl: "https://example.upstash.io",
			upstashToken: "example-token",
		});

		expect(connection.client.ping).toBeTypeOf("function");
		await connection.close();
	});

	it("refuses Upstash without a token", (): void => {
		expect(() =>
			cacheConnectionCreate({
				driver: REDIS_DRIVER.UPSTASH,
				upstashUrl: "https://example.upstash.io",
			}),
		).toThrow("Upstash Redis URL and token are required");
	});

	it("refuses the node driver without a URL", (): void => {
		expect(() => cacheConnectionCreate({ driver: REDIS_DRIVER.NODE })).toThrow(
			"REDIS_URL is required",
		);
	});
});
