import { PERMISSION } from "@app/permissions";
import {
	roleCreateInputSchema,
	roleKeyInputSchema,
	roleListSchema,
	roleSchema,
	roleUpdateInputSchema,
} from "@app/schemas";
import { z } from "zod";
import { roleCreate } from "#/role/application/role-create.ts";
import { roleDelete } from "#/role/application/role-delete.ts";
import { roleGet } from "#/role/application/role-get.ts";
import { roleList } from "#/role/application/role-list.ts";
import { roleUpdate } from "#/role/application/role-update.ts";
import { permissionRequire } from "#/platform/orpc/middleware.ts";
import {
	effectRun,
	effectRunTransactional,
} from "#/platform/orpc/run-effect.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";

const roleRouter = {
	list: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.ROLES })
		.output(roleListSchema)
		.handler(({ context }) => effectRun(context.runtime, roleList())),

	get: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.ROLE })
		.input(roleKeyInputSchema)
		.output(roleSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, roleGet(input)),
		),

	create: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.ROLES })
		.input(roleCreateInputSchema)
		.output(roleSchema)
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				roleCreate(input, context.session!.user.id),
			),
		),

	update: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.ROLE })
		.input(roleUpdateInputSchema)
		.output(roleSchema)
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				roleUpdate(input, context.session!.user.id),
			),
		),

	remove: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.ROLE })
		.input(roleKeyInputSchema)
		.output(z.object({ key: z.string() }))
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				roleDelete(input, context.session!.user.id),
			),
		),
};

export type TRoleRouter = typeof roleRouter;

export const roleRouterBuild = (): TRoleRouter => roleRouter;
