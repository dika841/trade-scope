import { HEALTH_STATUS, healthSchema } from "@app/schemas";
import { APP_VERSION } from "@app/version";
import { publicProcedure } from "#/platform/orpc/middleware.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";

const healthRouter = {
	check: publicProcedure
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.HEALTH })
		.output(healthSchema)
		.handler(() => ({ status: HEALTH_STATUS.OK, version: APP_VERSION })),
};

export type THealthRouter = typeof healthRouter;

export const healthRouterBuild = (): THealthRouter => healthRouter;
