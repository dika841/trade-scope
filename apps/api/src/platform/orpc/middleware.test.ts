import { AUTH_MESSAGE } from "@app/messages";
import type { ORPCError } from "@orpc/server";
import { call } from "@orpc/server";
import { PERMISSION, type TPermission } from "@app/permissions";
import { describe, expect, it } from "vitest";
import type { TORPCContext } from "#/platform/orpc/context.ts";
import {
	permissionRequire,
	permissionRequireAny,
	protectedProcedure,
} from "#/platform/orpc/middleware.ts";
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
const HTTP_FORBIDDEN = 403;
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

const callWithPermissions = (
	procedure: ReturnType<typeof permissionRequireAny>,
	permissions: readonly TPermission[],
): Promise<unknown> =>
	call(
		procedure.handler(() => "ok"),
		undefined,
		{
			context: contextOf(SESSION_STATE.RESOLVED, {
				...SESSION,
				permissions,
			}),
		},
	);

const errorOfPermissions = async (
	procedure: ReturnType<typeof permissionRequireAny>,
	permissions: readonly TPermission[],
): Promise<ORPCError<string, unknown>> => {
	try {
		await callWithPermissions(procedure, permissions);
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

describe("permissionRequire", () => {
	it("requires every listed permission", async (): Promise<void> => {
		const procedure = permissionRequire(
			PERMISSION.ACTIVITY_READ,
			PERMISSION.INGESTION_READ,
		);

		expect(
			await callWithPermissions(procedure, [
				PERMISSION.ACTIVITY_READ,
				PERMISSION.INGESTION_READ,
			]),
		).toBe("ok");

		const error = await errorOfPermissions(procedure, [
			PERMISSION.ACTIVITY_READ,
		]);
		expect(error.status).toBe(HTTP_FORBIDDEN);
	});
});

describe("permissionRequireAny", () => {
	it("accepts a caller holding one of the listed permissions", async (): Promise<void> => {
		const procedure = permissionRequireAny(
			PERMISSION.INGESTION_READ,
			PERMISSION.DATA_SOURCE_MANAGE,
		);

		expect(
			await callWithPermissions(procedure, [PERMISSION.DATA_SOURCE_MANAGE]),
		).toBe("ok");
		expect(
			await callWithPermissions(procedure, [PERMISSION.INGESTION_READ]),
		).toBe("ok");
	});

	it("refuses a caller holding none of them", async (): Promise<void> => {
		const procedure = permissionRequireAny(
			PERMISSION.INGESTION_READ,
			PERMISSION.DATA_SOURCE_MANAGE,
		);
		const error = await errorOfPermissions(procedure, [
			PERMISSION.ACTIVITY_READ,
		]);

		expect(error.status).toBe(HTTP_FORBIDDEN);
		expect(error.message).toBe(AUTH_MESSAGE.FORBIDDEN);
	});
});
