import { PERMISSION } from "@app/permissions";
import { permissionListSchema } from "@app/schemas";
import { permissionList } from "#/permission/application/permission-list.ts";
import { permissionRequire } from "#/platform/orpc/middleware.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";

const permissionRouter = {
	list: permissionRequire(PERMISSION.USER_MANAGE)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.PERMISSIONS })
		.output(permissionListSchema)
		.handler(() => permissionList()),
};

export type TPermissionRouter = typeof permissionRouter;

export const permissionRouterBuild = (): TPermissionRouter => permissionRouter;
