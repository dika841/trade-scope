import { PERMISSION } from "@app/permissions";
import {
	dataSourceCreateInputSchema,
	dataSourceIdInputSchema,
	dataSourceListSchema,
	dataSourceSchema,
	dataSourceUpdateInputSchema,
} from "@app/schemas";
import { z } from "zod";
import { dataSourceCreate } from "#/data-source/application/data-source-create.ts";
import { dataSourceDelete } from "#/data-source/application/data-source-delete.ts";
import { dataSourceGet } from "#/data-source/application/data-source-get.ts";
import { dataSourceList } from "#/data-source/application/data-source-list.ts";
import { dataSourceUpdate } from "#/data-source/application/data-source-update.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";
import {
	permissionRequire,
	permissionRequireAny,
} from "#/platform/orpc/middleware.ts";
import {
	effectRun,
	effectRunTransactional,
} from "#/platform/orpc/run-effect.ts";

const dataSourceRouter = {
	list: permissionRequireAny(
		PERMISSION.INGESTION_READ,
		PERMISSION.DATA_SOURCE_MANAGE,
	)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.DATA_SOURCES })
		.output(dataSourceListSchema)
		.handler(({ context }) => effectRun(context.runtime, dataSourceList())),

	get: permissionRequire(PERMISSION.DATA_SOURCE_MANAGE)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.DATA_SOURCE })
		.input(dataSourceIdInputSchema)
		.output(dataSourceSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, dataSourceGet(input)),
		),

	create: permissionRequire(PERMISSION.DATA_SOURCE_MANAGE)
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.DATA_SOURCES })
		.input(dataSourceCreateInputSchema)
		.output(dataSourceSchema)
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				dataSourceCreate(input, context.session!.user.id),
			),
		),

	update: permissionRequire(PERMISSION.DATA_SOURCE_MANAGE)
		.route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.DATA_SOURCE })
		.input(dataSourceUpdateInputSchema)
		.output(dataSourceSchema)
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				dataSourceUpdate(input, context.session!.user.id),
			),
		),

	remove: permissionRequire(PERMISSION.DATA_SOURCE_MANAGE)
		.route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.DATA_SOURCE })
		.input(dataSourceIdInputSchema)
		.output(z.object({ id: z.uuid() }))
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				dataSourceDelete(input, context.session!.user.id),
			),
		),
};

export type TDataSourceRouter = typeof dataSourceRouter;

export const dataSourceRouterBuild = (): TDataSourceRouter => dataSourceRouter;
