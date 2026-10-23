import { describe, expect, it } from "vitest";
import { activityMetadataDecode } from "#/activity/infrastructure/activity-metadata.ts";

describe("activityMetadataDecode", () => {
	it("passes a flat map of primitives through", () => {
		expect(activityMetadataDecode({ role: "analyst", revoked: true })).toEqual({
			role: "analyst",
			revoked: true,
		});
	});

	it("keeps an absent value absent", () => {
		expect(activityMetadataDecode(null)).toBeNull();
	});

	it("drops a stored value that no longer matches the contract instead of failing the list", () => {
		expect(activityMetadataDecode({ changes: { role: "analyst" } })).toBeNull();
		expect(activityMetadataDecode("free text")).toBeNull();
	});
});
