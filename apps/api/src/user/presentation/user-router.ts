import { PERMISSION } from "@app/permissions";
import {
	userCreateInputSchema,
	userIdInputSchema,
	userListInputSchema,
	userListSchema,
	userPasswordResetInputSchema,
	userSchema,
	userUpdateInputSchema,
} from "@app/schemas";
import { z } from "zod";
import { userCreate } from "#/user/application/user-create.ts";
import { userDelete } from "#/user/application/user-delete.ts";
import { userGet } from "#/user/application/user-get.ts";
import { userList } from "#/user/application/user-list.ts";
import { userPasswordReset } from "#/user/application/user-password-reset.ts";
import { userUpdate } from "#/user/application/user-update.ts";
import { permissionRequire } from "#/platform/orpc/middleware.ts";
import {
	effectRun,
	effectRunTransactional,
} from "#/platform/orpc/run-effect.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";

const userRouter = {
	list: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.USERS })
		.input(userListInputSchema)
		.output(userListSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, userList(input)),
		),

	get: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.USER })
		.input(userIdInputSchema)
		.output(userSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, userGet(input)),
		),

	create: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.USERS })
		.input(userCreateInputSchema)
		.output(userSchema)
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				userCreate(input, context.session!.user.id),
			),
		),

	update: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.USER })
		.input(userUpdateInputSchema)
		.output(userSchema)
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				userUpdate(input, context.session!.user.id),
			),
		),

	remove: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.USER })
		.input(userIdInputSchema)
		.output(z.object({ id: z.uuid() }))
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				userDelete(input, context.session!.user.id),
			),
		),

	resetPassword: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.USER_PASSWORD })
		.input(userPasswordResetInputSchema)
		.output(z.object({ id: z.uuid() }))
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				userPasswordReset(input, context.session!.user.id),
			),
		),
};

export type TUserRouter = typeof userRouter;

export const userRouterBuild = (): TUserRouter => userRouter;
