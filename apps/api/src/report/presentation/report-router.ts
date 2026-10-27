import { PERMISSION } from "@app/permissions";
import {
	reportCreateInputSchema,
	reportIdInputSchema,
	reportListInputSchema,
	reportListSchema,
	reportSchema,
	reportShareInputSchema,
	reportSummarySchema,
	sharedReportSchema,
} from "@app/schemas";
import { z } from "zod";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";
import {
	permissionRequire,
	publicProcedure,
} from "#/platform/orpc/middleware.ts";
import {
	effectRun,
	effectRunTransactional,
} from "#/platform/orpc/run-effect.ts";
import { reportCreate } from "#/report/application/report-create.ts";
import { reportDelete } from "#/report/application/report-delete.ts";
import { reportGet } from "#/report/application/report-get.ts";
import { reportList } from "#/report/application/report-list.ts";
import { reportRevoke } from "#/report/application/report-revoke.ts";
import { reportShared } from "#/report/application/report-shared.ts";

const reportRouter = {
	list: permissionRequire(PERMISSION.REPORT_READ)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.REPORTS })
		.input(reportListInputSchema)
		.output(reportListSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, reportList(input)),
		),

	shared: publicProcedure
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.REPORT_SHARED })
		.input(reportShareInputSchema)
		.output(sharedReportSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, reportShared(input)),
		),

	get: permissionRequire(PERMISSION.REPORT_READ)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.REPORT })
		.input(reportIdInputSchema)
		.output(reportSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, reportGet(input)),
		),

	create: permissionRequire(PERMISSION.REPORT_MANAGE)
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.REPORTS })
		.input(reportCreateInputSchema)
		.output(reportSchema)
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				reportCreate(input, context.session!.user.id),
			),
		),

	revoke: permissionRequire(PERMISSION.REPORT_MANAGE)
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.REPORT_REVOKE })
		.input(reportIdInputSchema)
		.output(reportSummarySchema)
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				reportRevoke(input, context.session!.user.id),
			),
		),

	remove: permissionRequire(PERMISSION.REPORT_MANAGE)
		.route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.REPORT })
		.input(reportIdInputSchema)
		.output(z.object({ id: z.uuid() }))
		.handler(({ input, context }) =>
			effectRunTransactional(
				context.runtime,
				reportDelete(input, context.session!.user.id),
			),
		),
};

export type TReportRouter = typeof reportRouter;

export const reportRouterBuild = (): TReportRouter => reportRouter;
