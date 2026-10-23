import { NOT_SET } from "@app/format";
import { describe, expect, it } from "vitest";
import { metadataLabel } from "#/routes/_authenticated/activity/_utils/metadata-label.ts";

describe("metadataLabel", () => {
	it("shows a dash when an entry carries no details", (): void => {
		expect(metadataLabel(null)).toBe(NOT_SET);
		expect(metadataLabel({})).toBe(NOT_SET);
	});

	it("lists each detail as a key and value in words, not as JSON", (): void => {
		expect(metadataLabel({ role: "analyst", revoked: true })).toBe(
			"role: analyst, revoked: true",
		);
	});
});
