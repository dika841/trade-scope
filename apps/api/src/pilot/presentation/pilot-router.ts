import { PERMISSION } from "@app/permissions";
import { PILOT_MAIL_KIND } from "@app/mail";
import {
	pilotCreateInputSchema,
	pilotIdInputSchema,
	pilotListInputSchema,
	pilotListSchema,
	pilotOptionsSchema,
	pilotSchema,
	pilotUpdateInputSchema,
} from "@app/schemas";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PATH } from "#/platform/http/route-paths.ts";
import { permissionRequire } from "#/platform/orpc/middleware.ts";
import {
	effectRun,
	effectRunTransactional,
} from "#/platform/orpc/run-effect.ts";
import { pilotCreate } from "#/pilot/application/pilot-create.ts";
import { pilotGet } from "#/pilot/application/pilot-get.ts";
import { pilotList } from "#/pilot/application/pilot-list.ts";
import { pilotNotify } from "#/pilot/application/pilot-notify.ts";
import { pilotOptions } from "#/pilot/application/pilot-options.ts";
import { pilotUpdate } from "#/pilot/application/pilot-update.ts";

const pilotRouter = {
	list: permissionRequire(PERMISSION.PILOT_READ)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.PILOTS })
		.input(pilotListInputSchema)
		.output(pilotListSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, pilotList(input)),
		),

	options: permissionRequire(PERMISSION.PILOT_READ)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.PILOT_OPTIONS })
		.output(pilotOptionsSchema)
		.handler(({ context }) => effectRun(context.runtime, pilotOptions())),

	get: permissionRequire(PERMISSION.PILOT_READ)
		.route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.PILOT })
		.input(pilotIdInputSchema)
		.output(pilotSchema)
		.handler(({ input, context }) =>
			effectRun(context.runtime, pilotGet(input)),
		),

	create: permissionRequire(PERMISSION.PILOT_MANAGE)
		.route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.PILOTS })
		.input(pilotCreateInputSchema)
		.output(pilotSchema)
		.handler(async ({ input, context }) => {
			const run = await effectRunTransactional(
				context.runtime,
				pilotCreate(input, context.session!.user.id),
			);
			await effectRun(
				context.runtime,
				pilotNotify(
					{ id: run.id, kind: PILOT_MAIL_KIND.ASSIGNED },
					context.session!.user.id,
				),
			);

			return run;
		}),

	update: permissionRequire(PERMISSION.PILOT_MANAGE)
		.route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.PILOT })
		.input(pilotUpdateInputSchema)
		.output(pilotSchema)
		.handler(async ({ input, context }) => {
			const run = await effectRunTransactional(
				context.runtime,
				pilotUpdate(input, context.session!.user.id),
			);

			if (input.status !== undefined || input.ownerId !== undefined) {
				await effectRun(
					context.runtime,
					pilotNotify(
						{ id: run.id, kind: PILOT_MAIL_KIND.UPDATED },
						context.session!.user.id,
					),
				);
			}

			return run;
		}),
};

export type TPilotRouter = typeof pilotRouter;

export const pilotRouterBuild = (): TPilotRouter => pilotRouter;
