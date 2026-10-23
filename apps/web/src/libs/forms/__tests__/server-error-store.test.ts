import { describe, expect, it } from "vitest";
import { serverErrorStoreCreate } from "#/libs/forms/server-error-store.ts";

describe("serverErrorStoreCreate", () => {
	it("starts with no error", (): void => {
		expect(serverErrorStoreCreate().store.state).toBeNull();
	});

	it("holds the message it was given", (): void => {
		const serverError = serverErrorStoreCreate();

		serverError.set("That email or password is incorrect.");

		expect(serverError.store.state).toBe(
			"That email or password is incorrect.",
		);
	});

	it("clears back to no error", (): void => {
		const serverError = serverErrorStoreCreate();

		serverError.set("Something failed.");
		serverError.clear();

		expect(serverError.store.state).toBeNull();
	});

	it("gives each form its own isolated store", (): void => {
		const login = serverErrorStoreCreate();
		const passwordChange = serverErrorStoreCreate();

		login.set("Login failed.");

		expect(passwordChange.store.state).toBeNull();
	});
});
