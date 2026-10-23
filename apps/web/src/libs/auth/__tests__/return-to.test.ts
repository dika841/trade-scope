import { describe, expect, it } from "vitest";
import { RETURN_TO_DEFAULT, returnToResolve } from "#/libs/auth/return-to.ts";

describe("returnToResolve", () => {
	it("goes to the dashboard when nothing was requested", (): void => {
		expect(returnToResolve(undefined)).toBe(RETURN_TO_DEFAULT);
	});

	it("returns to a page inside the app, search included", (): void => {
		expect(returnToResolve("/users?page=2")).toBe("/users?page=2");
	});

	it("refuses to leave the app through an absolute or protocol-relative URL", (): void => {
		expect(returnToResolve("https://evil.test/")).toBe(RETURN_TO_DEFAULT);
		expect(returnToResolve("//evil.test/")).toBe(RETURN_TO_DEFAULT);
		expect(returnToResolve("/\\evil.test")).toBe(RETURN_TO_DEFAULT);
	});
});
