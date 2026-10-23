import { AUTH_MESSAGE } from "@app/messages";
import { describe, expect, it } from "vitest";
import {
	passwordChangeErrorMessage,
	signInErrorMessage,
} from "#/libs/auth/auth-error.ts";

const LIBRARY_MESSAGE = "Invalid email or password";

describe("signInErrorMessage", () => {
	it("names wrong credentials in our own words", (): void => {
		expect(signInErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
			AUTH_MESSAGE.INVALID_CREDENTIALS,
		);
	});

	it("does not blame the credentials for any other failure", (): void => {
		expect(signInErrorMessage({ code: "TOO_MANY_REQUESTS" })).toBe(
			AUTH_MESSAGE.SIGN_IN_FAILED,
		);
		expect(signInErrorMessage({})).toBe(AUTH_MESSAGE.SIGN_IN_FAILED);
	});

	it("never surfaces the library's own wording", (): void => {
		expect(signInErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).not.toBe(
			LIBRARY_MESSAGE,
		);
	});
});

describe("passwordChangeErrorMessage", () => {
	it("names a wrong current password", (): void => {
		expect(passwordChangeErrorMessage({ code: "INVALID_PASSWORD" })).toBe(
			AUTH_MESSAGE.CURRENT_PASSWORD_INCORRECT,
		);
	});

	it("falls back to a generic failure otherwise", (): void => {
		expect(passwordChangeErrorMessage({})).toBe(
			AUTH_MESSAGE.PASSWORD_CHANGE_FAILED,
		);
	});
});
