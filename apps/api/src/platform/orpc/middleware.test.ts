import { AUTH_MESSAGE } from "@app/messages";
import { type ORPCError, call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import type { TORPCContext } from "#/platform/orpc/context.ts";
import { protectedProcedure } from "#/platform/orpc/middleware.ts";
import {
	SESSION_STATE,
	type TSession,
	type TSessionState,
} from "#/shared/session.ts";

const SESSION: TSession = {
	user: { id: "u1", email: "a@b.test", name: "A", role: "admin" },
	permissions: [],
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_SERVICE_UNAVAILABLE = 503;

const contextOf = (
	sessionState: TSessionState,
	session: TSession | null,
): TORPCContext =>
	({
		headers: new Headers(),
		session,
		sessionState,
		permissions: session?.permissions ?? [],
	}) as unknown as TORPCContext;

const callWith = (
	sessionState: TSessionState,
	session: TSession | null,
): Promise<unknown> =>
	call(
		protectedProcedure.handler(() => "ok"),
		undefined,
		{
			context: contextOf(sessionState, session),
		},
	);

const errorOf = async (
	sessionState: TSessionState,
	session: TSession | null,
): Promise<ORPCError<string, unknown>> => {
	try {
		await callWith(sessionState, session);
	} catch (error) {
		return error as ORPCError<string, unknown>;
	}
	throw new Error("expected the procedure to reject");
};

describe("protectedProcedure", () => {
	it("runs the handler for a resolved session", async (): Promise<void> => {
		expect(await callWith(SESSION_STATE.RESOLVED, SESSION)).toBe("ok");
	});

	it("answers unauthorized when nobody is signed in", async (): Promise<void> => {
		const error = await errorOf(SESSION_STATE.ANONYMOUS, null);

		expect(error.status).toBe(HTTP_UNAUTHORIZED);
		expect(error.message).toBe(AUTH_MESSAGE.UNAUTHORIZED);
	});

	it("answers service unavailable when the session could not be checked at all", async (): Promise<void> => {
		const error = await errorOf(SESSION_STATE.UNAVAILABLE, null);

		expect(error.status).toBe(HTTP_SERVICE_UNAVAILABLE);
		expect(error.message).toBe(AUTH_MESSAGE.SESSION_UNAVAILABLE);
	});

	it("does not report an outage as being signed out", async (): Promise<void> => {
		const outage = await errorOf(SESSION_STATE.UNAVAILABLE, null);
		const anonymous = await errorOf(SESSION_STATE.ANONYMOUS, null);

		expect(outage.status).not.toBe(anonymous.status);
	});
});
