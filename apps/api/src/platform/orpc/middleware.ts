import { AUTH_MESSAGE } from "@app/messages";
import { canAll, type TPermission } from "@app/permissions";
import { D } from "@mobily/ts-belt";
import { ORPCError, os } from "@orpc/server";
import { match, P } from "ts-pattern";
import type { TORPCContext } from "#/platform/orpc/context.ts";
import { SESSION_STATE } from "#/shared/session.ts";
import { toORPCError } from "#/platform/orpc/error-mapping.ts";

const base = os.$context<TORPCContext>();

export const publicProcedure = base.use(async ({ next }) => {
	try {
		return await next();
	} catch (error) {
		throw toORPCError(error);
	}
});

export const protectedProcedure = publicProcedure.use(
	async ({ context, next }) =>
		match({ state: context.sessionState, session: context.session })
			.with({ state: SESSION_STATE.UNAVAILABLE }, () => {
				throw new ORPCError("SERVICE_UNAVAILABLE", {
					message: AUTH_MESSAGE.SESSION_UNAVAILABLE,
				});
			})
			.with({ session: P.nullish }, () => {
				throw new ORPCError("UNAUTHORIZED", {
					message: AUTH_MESSAGE.UNAUTHORIZED,
				});
			})
			.otherwise(({ session }) =>
				next({ context: D.merge(context, { session }) }),
			),
);

type TProtectedProcedure = typeof protectedProcedure;

export const permissionRequire = (
	...required: TPermission[]
): TProtectedProcedure =>
	protectedProcedure.use(async ({ context, next }) =>
		match(canAll(context.permissions, required))
			.with(false, () => {
				throw new ORPCError("FORBIDDEN", { message: AUTH_MESSAGE.FORBIDDEN });
			})
			.otherwise(() => next({ context })),
	);
