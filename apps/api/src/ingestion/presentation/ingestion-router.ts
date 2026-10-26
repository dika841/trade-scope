import { PERMISSION } from "@app/permissions";
import {
	ingestionIdInputSchema,
	ingestionListInputSchema,
	ingestionListSchema,
	ingestionRunCreateInputSchema,
	ingestionRunDetailSchema,
	ingestionRunSchema,
	ingestionStatsSchema,
} from "@app/schemas";
import { ingestionCreate } from "#/ingestion/application/ingestion-create.ts";
import { ingestionEnqueue } from "#/ingestion/application/ingestion-enqueue.ts";
import { ingestionGet } from "#/ingestion/application/ingestion-get.ts";
import { ingestionList } from "#/ingestion/application/ingestion-list.ts";
import { ingestionRetry } from "#/ingestion/application/ingestion-retry.ts";
import { ingestionStats } from "#/ingestion/application/ingestion-stats.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";
import { permissionRequire } from "#/platform/orpc/middleware.ts";
import {
	effectRun,
	effectRunTransactional,
} from "#/platform/orpc/run-effect.ts";

const ingestionRouter = {
	list: permissionRequire(PERMISSION.INGESTION_READ)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.INGESTION_RUNS })
		.input(ingestionListInputSchema)
		.output(ingestionListSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, ingestionList(input)),
		),

	stats: permissionRequire(PERMISSION.INGESTION_READ)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.INGESTION_STATS })
		.output(ingestionStatsSchema)
		.handler(({ context }) => effectRun(context.runtime, ingestionStats())),

	get: permissionRequire(PERMISSION.INGESTION_READ)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.INGESTION_RUN })
		.input(ingestionIdInputSchema)
		.output(ingestionRunDetailSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, ingestionGet(input)),
		),

	run: permissionRequire(PERMISSION.INGESTION_RUN)
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.INGESTION_RUNS })
		.input(ingestionRunCreateInputSchema)
		.output(ingestionRunSchema)
		.handler(async ({ input, context }) => {
			const run = await effectRunTransactional(
				context.runtime,
				ingestionCreate(input, context.session!.user.id),
			);
			await effectRun(context.runtime, ingestionEnqueue(run.id));

			return run;
		}),

	retry: permissionRequire(PERMISSION.INGESTION_RUN)
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.INGESTION_RETRY })
		.input(ingestionIdInputSchema)
		.output(ingestionRunSchema)
		.handler(async ({ input, context }) => {
			const run = await effectRunTransactional(
				context.runtime,
				ingestionRetry(input, context.session!.user.id),
			);
			await effectRun(context.runtime, ingestionEnqueue(run.id));

			return run;
		}),
};

export type TIngestionRouter = typeof ingestionRouter;

export const ingestionRouterBuild = (): TIngestionRouter => ingestionRouter;
