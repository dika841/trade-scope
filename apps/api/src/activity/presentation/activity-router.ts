import { PERMISSION } from "@app/permissions";
import { activityListInputSchema, activityListSchema } from "@app/schemas";
import { activityList } from "#/activity/application/activity-list.ts";
import { permissionRequire } from "#/platform/orpc/middleware.ts";
import { effectRun } from "#/platform/orpc/run-effect.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";

const activityRouter = {
	list: permissionRequire(PERMISSION.ACTIVITY_READ)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.ACTIVITY })
		.input(activityListInputSchema)
		.output(activityListSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, activityList(input)),
		),
};

export type TActivityRouter = typeof activityRouter;

export const activityRouterBuild = (): TActivityRouter => activityRouter;
