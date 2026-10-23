import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { signOutPerform } from "#/libs/auth/sign-out.ts";

const CACHED_KEY = ["user", "list"];

const clientWithData = (): QueryClient => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(CACHED_KEY, { items: ["someone else's account"] });
	return queryClient;
};

describe("signOutPerform", () => {
	it("clears the cache so the next account is not served the last one's data", async (): Promise<void> => {
		const queryClient = clientWithData();

		await signOutPerform({
			signOut: async () => ({}),
			queryClient,
			onSignedOut: (): void => undefined,
			onFailure: (): void => undefined,
		});

		expect(queryClient.getQueryData(CACHED_KEY)).toBeUndefined();
	});

	it("signs out locally only once the server agreed", async (): Promise<void> => {
		const onSignedOut = vi.fn();

		await signOutPerform({
			signOut: async () => ({}),
			queryClient: clientWithData(),
			onSignedOut,
			onFailure: (): void => undefined,
		});

		expect(onSignedOut).toHaveBeenCalledTimes(1);
	});

	it("keeps the session when the server refused, rather than looking signed out", async (): Promise<void> => {
		const queryClient = clientWithData();
		const onSignedOut = vi.fn();
		const onFailure = vi.fn();

		await signOutPerform({
			signOut: async () => ({ error: { message: "revoke failed" } }),
			queryClient,
			onSignedOut,
			onFailure,
		});

		expect(onSignedOut).not.toHaveBeenCalled();
		expect(onFailure).toHaveBeenCalledTimes(1);
		expect(queryClient.getQueryData(CACHED_KEY)).toBeDefined();
	});

	it("treats a request that never arrived as a refusal", async (): Promise<void> => {
		const onSignedOut = vi.fn();
		const onFailure = vi.fn();

		await signOutPerform({
			signOut: async () => {
				throw new Error("network down");
			},
			queryClient: clientWithData(),
			onSignedOut,
			onFailure,
		});

		expect(onSignedOut).not.toHaveBeenCalled();
		expect(onFailure).toHaveBeenCalledTimes(1);
	});
});
