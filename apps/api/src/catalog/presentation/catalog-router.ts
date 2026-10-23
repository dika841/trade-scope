import {
	catalogProductDetailSchema,
	catalogProductInputSchema,
	catalogSearchInputSchema,
	catalogSearchResultSchema,
} from "@app/schemas";
import { catalogGet } from "#/catalog/application/catalog-get.ts";
import { catalogSearch } from "#/catalog/application/catalog-search.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";
import { publicProcedure } from "#/platform/orpc/middleware.ts";
import { effectRun } from "#/platform/orpc/run-effect.ts";

const catalogRouter = {
	search: publicProcedure
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.PRODUCTS })
		.input(catalogSearchInputSchema)
		.output(catalogSearchResultSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, catalogSearch(input)),
		),

	get: publicProcedure
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.PRODUCT })
		.input(catalogProductInputSchema)
		.output(catalogProductDetailSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, catalogGet(input)),
		),
};

export type TCatalogRouter = typeof catalogRouter;

export const catalogRouterBuild = (): TCatalogRouter => catalogRouter;
