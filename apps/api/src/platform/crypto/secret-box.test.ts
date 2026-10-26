import { beforeAll, describe, expect, it, vi } from "vitest";
import { secretHint, secretOpen, secretSeal } from "./secret-box.ts";

beforeAll((): void => {
	vi.stubEnv("DATABASE_URL", "postgres://app:app@localhost:5432/app");
	vi.stubEnv("REDIS_URL", "redis://localhost:6379");
	vi.stubEnv("RABBITMQ_URL", "amqp://app:app@localhost:5672");
	vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3001");
	vi.stubEnv("BETTER_AUTH_SECRET", "unit-test-secret-at-least-32-characters");
});

describe("secret-box", () => {
	it("round-trips a token", (): void => {
		const sealed = secretSeal("token-value-1234");

		expect(sealed).not.toContain("token-value");
		expect(secretOpen(sealed)).toBe("token-value-1234");
	});

	it("produces a different ciphertext for the same token", (): void => {
		expect(secretSeal("token-value-1234")).not.toBe(
			secretSeal("token-value-1234"),
		);
	});

	it("keeps only the last four characters as the hint", (): void => {
		expect(secretHint("token-value-1234")).toBe("1234");
	});

	it("fails to open a tampered ciphertext", (): void => {
		const sealed = secretSeal("token-value-1234");
		const tampered = `${sealed.slice(0, -4)}AAAA`;

		expect(() => secretOpen(tampered)).toThrow();
	});
});
