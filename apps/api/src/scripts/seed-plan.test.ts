import { describe, expect, it } from "vitest";
import { SEED_PASSWORD_DEFAULT, seedPlanFor } from "#/scripts/seed-plan.ts";

const CONFIGURED = "a-password-set-by-the-operator";

describe("seedPlanFor", () => {
	it("seeds the documented logins and the demo data outside production", () => {
		expect(
			seedPlanFor({ NODE_ENV: "development", SEED_PASSWORD: undefined }),
		).toEqual({ password: SEED_PASSWORD_DEFAULT, demoData: true });
	});

	it("uses the configured password outside production when one is set", () => {
		expect(
			seedPlanFor({ NODE_ENV: "test", SEED_PASSWORD: CONFIGURED }),
		).toEqual({ password: CONFIGURED, demoData: true });
	});

	it("refuses to seed production without a configured password", () => {
		expect(
			seedPlanFor({ NODE_ENV: "production", SEED_PASSWORD: undefined }),
		).toBeNull();
	});

	it("seeds only the admin in production, with the configured password", () => {
		expect(
			seedPlanFor({ NODE_ENV: "production", SEED_PASSWORD: CONFIGURED }),
		).toEqual({ password: CONFIGURED, demoData: false });
	});
});
