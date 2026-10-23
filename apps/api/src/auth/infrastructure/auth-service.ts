import { ROLE } from "@app/permissions";
import { Context, Effect, Layer } from "effect";
import { match, P } from "ts-pattern";
import { EAuth, type EDatabase } from "#/shared/errors.ts";
import { permissionsResolve } from "#/role/index.ts";
import type { TAuthService } from "#/auth/domain/auth-service.ts";
import type { TSession, TSessionUser } from "#/shared/session.ts";
import { authCreate, type TAuth } from "#/auth/infrastructure/better-auth.ts";
import { DbService, dbServiceLayer } from "#/platform/db/db-service.ts";
import { customRoleRepoLayer } from "#/role/index.ts";
import type { TActivityEntry, TActivityRepo } from "@app/activity";
import { activityRecorderLayer } from "#/activity/index.ts";
import { ActivityRecorder } from "#/shared/activity-recorder.ts";
import { CustomRoleRepo } from "#/role/index.ts";
import { MailService, mailServiceLayer } from "#/platform/mail/mailer.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { SERVICE_TAG } from "#/platform/service-tags.ts";

export type TAuthServiceShape = TAuthService & { readonly auth: TAuth };

type TSessionEffect = Effect.Effect<TSession | null, EDatabase>;

export type TAuthServiceId = TServiceId<typeof SERVICE_TAG.AUTH>;

export const AuthService = Context.Service<TAuthServiceId, TAuthServiceShape>(
	SERVICE_TAG.AUTH,
);

export const authServiceLayer = Layer.effect(
	AuthService,
	Effect.gen(function* () {
		const { db } = yield* DbService;
		const customRoleRepo = yield* CustomRoleRepo;
		const { mailer } = yield* MailService;
		const recorder = yield* ActivityRecorder;

		const activityRepo: TActivityRepo = {
			insert: async (entry: TActivityEntry): Promise<void> => {
				await Effect.runPromise(recorder.insert(entry));
			},
		};

		const auth = authCreate({ db, activityRepo, mailer });

		const sessionBuild = (
			user: Pick<TSessionUser, "id" | "email" | "name">,
			role: string,
		): TSessionEffect =>
			permissionsResolve(role).pipe(
				Effect.provideService(CustomRoleRepo, customRoleRepo),
				Effect.map(
					(permissions): TSession => ({
						user: { id: user.id, email: user.email, name: user.name, role },
						permissions,
					}),
				),
			);

		const getSession: TAuthService["getSession"] = (headers: Headers) =>
			Effect.tryPromise({
				try: () => auth.api.getSession({ headers }),
				catch: (cause) => new EAuth({ cause }),
			}).pipe(
				Effect.flatMap(
					(result): TSessionEffect =>
						match(result)
							.with(P.nullish, (): TSessionEffect => Effect.succeed(null))
							.with(
								{ session: P.nullish },
								(): TSessionEffect => Effect.succeed(null),
							)
							.with(
								{ user: P.nullish },
								(): TSessionEffect => Effect.succeed(null),
							)
							.otherwise(({ user }) =>
								sessionBuild(user, user.role ?? ROLE.VIEWER),
							),
				),
			);

		return AuthService.of({ auth, getSession });
	}),
).pipe(
	Layer.provide(
		Layer.mergeAll(
			dbServiceLayer,
			customRoleRepoLayer,
			mailServiceLayer,
			activityRecorderLayer,
		),
	),
);
