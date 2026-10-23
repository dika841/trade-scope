import { ERROR_MESSAGE } from "@app/messages";
import { describe, expect, it } from "vitest";
import {
	EServerUnreachable,
	isServerUnreachable,
} from "#/libs/auth/server-unreachable.ts";

describe("EServerUnreachable", () => {
	it("carries the unreachable title as its message", (): void => {
		expect(new EServerUnreachable().message).toBe(
			ERROR_MESSAGE.SERVER_UNREACHABLE_TITLE,
		);
	});

	it("is recognised by isServerUnreachable", (): void => {
		expect(isServerUnreachable(new EServerUnreachable())).toBe(true);
	});

	it("does not claim an ordinary error is a connection problem", (): void => {
		expect(isServerUnreachable(new Error("boom"))).toBe(false);
	});
});
