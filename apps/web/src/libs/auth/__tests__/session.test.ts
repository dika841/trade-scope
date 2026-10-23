import { PERMISSION, ROLE } from "@app/permissions";
import type { TMe } from "@app/schemas";
import { ORPCError } from "@orpc/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_REACH } from "#/libs/auth/session-reach.ts";
import { sessionRefresh, sessionResolve } from "#/libs/auth/session.ts";
import { sessionSet, sessionStore } from "#/libs/auth/session-store.ts";
import { orpc } from "#/libs/orpc/client.ts";

vi.mock("#/libs/orpc/client.ts", () => ({
	orpc: { me: { get: { call: vi.fn() } } },
}));

const ME: TMe = {
	user: {
		id: "11111111-1111-4111-8111-111111111111",
		email: "ada@test.app",
		name: "Ada",
		role: ROLE.ADMIN,
	},
	permissions: [PERMISSION.USER_MANAGE],
};

const meGet = vi.mocked(orpc.me.get.call);

beforeEach((): void => {
	vi.spyOn(console, "error").mockImplementation((): void => undefined);
});

afterEach((): void => {
	vi.restoreAllMocks();
	meGet.mockReset();
	sessionSet(null);
});

describe("sessionResolve", () => {
	it("reports a reached server with the signed-in user", async (): Promise<void> => {
		meGet.mockResolvedValue(ME);

		await expect(sessionResolve()).resolves.toStrictEqual({
			reach: SESSION_REACH.REACHED,
			session: ME,
		});
	});

	it("treats a 401 as a reached server with nobody signed in", async (): Promise<void> => {
		meGet.mockRejectedValue(new ORPCError("UNAUTHORIZED"));

		await expect(sessionResolve()).resolves.toStrictEqual({
			reach: SESSION_REACH.REACHED,
			session: null,
		});
	});

	it("treats a 500 as unreachable so the user is never told they signed out", async (): Promise<void> => {
		meGet.mockRejectedValue(new ORPCError("INTERNAL_SERVER_ERROR"));

		await expect(sessionResolve()).resolves.toStrictEqual({
			reach: SESSION_REACH.UNREACHABLE,
			session: null,
		});
	});

	it("treats a failed fetch as unreachable rather than signed out", async (): Promise<void> => {
		meGet.mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(sessionResolve()).resolves.toStrictEqual({
			reach: SESSION_REACH.UNREACHABLE,
			session: null,
		});
	});

	it("logs the cause instead of swallowing it", async (): Promise<void> => {
		const failure = new TypeError("Failed to fetch");
		meGet.mockRejectedValue(failure);

		await sessionResolve();

		expect(console.error).toHaveBeenCalledWith(
			"session resolution failed",
			failure,
		);
	});
});

describe("sessionRefresh", () => {
	it("publishes the resolved session to the store", async (): Promise<void> => {
		meGet.mockResolvedValue(ME);

		await sessionRefresh();

		expect(sessionStore.state).toStrictEqual({
			reach: SESSION_REACH.REACHED,
			session: ME,
		});
	});

	it("publishes unreachable without clearing the reach flag to reached", async (): Promise<void> => {
		meGet.mockRejectedValue(new ORPCError("SERVICE_UNAVAILABLE"));

		await sessionRefresh();

		expect(sessionStore.state).toStrictEqual({
			reach: SESSION_REACH.UNREACHABLE,
			session: null,
		});
	});
});
