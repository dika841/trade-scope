import { marketDemandSchema, marketInputSchema } from "@app/schemas";
import { marketGet } from "#/market/application/market-get.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";
import { publicProcedure } from "#/platform/orpc/middleware.ts";
import { effectRun } from "#/platform/orpc/run-effect.ts";

const marketRouter = {
	get: publicProcedure
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.PRODUCT_MARKETS })
		.input(marketInputSchema)
		.output(marketDemandSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, marketGet(input)),
		),
};

export type TMarketRouter = typeof marketRouter;

export const marketRouterBuild = (): TMarketRouter => marketRouter;
