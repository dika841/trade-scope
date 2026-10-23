import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { TActivityRepo } from "@app/activity";
import {
	MAIL_TEMPLATE,
	mailSendSafe,
	passwordResetMailBuild,
	type TMailer,
} from "@app/mail";
import { ROLE } from "@app/permissions";
import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import type { TDb } from "#/platform/db/client.ts";
import { dbActiveProxy } from "#/platform/db/transaction.ts";
import { env } from "#/platform/config/env.ts";
import { logger } from "#/platform/observability/logger.ts";

type TCreateAuthOptions = {
	db: TDb;
	activityRepo: TActivityRepo;
	mailer: TMailer;
};

export const authCreate = (deps: TCreateAuthOptions) =>
	betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.WEB_ORIGIN],
		database: drizzleAdapter(dbActiveProxy(deps.db), { provider: "pg" }),
		advanced: { database: { generateId: (): string => crypto.randomUUID() } },
		emailAndPassword: {
			enabled: true,
			sendResetPassword: async ({ user, url }): Promise<void> => {
				await mailSendSafe(
					deps.mailer,
					logger,
					MAIL_TEMPLATE.PASSWORD_RESET,
					passwordResetMailBuild({ to: user.email, name: user.name, url }),
				);
			},
		},
		user: {
			additionalFields: {
				role: { type: "string", defaultValue: ROLE.VIEWER, input: false },
			},
		},
		databaseHooks: {
			session: {
				create: {
					after: async (session) => {
						await deps.activityRepo.insert({
							actorId: session.userId,
							action: ACTIVITY_ACTION.SESSION_CREATE,
							resourceType: ACTIVITY_RESOURCE_TYPE.SESSION,
							resourceId: session.id,
						});
					},
				},
			},
		},
	});

export type TAuth = ReturnType<typeof authCreate>;
