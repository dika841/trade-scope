import { ROLE } from "@app/permissions";
import type { TUserCreateInput } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { match, P } from "ts-pattern";
import { runtime } from "#/bootstrap/compose.ts";
import {
	AuthService,
	type TAuthServiceId,
} from "#/auth/infrastructure/auth-service.ts";
import { env } from "#/platform/config/env.ts";
import { DbService, type TDbServiceId } from "#/platform/db/db-service.ts";
import { user } from "#/platform/db/tables/auth.ts";
import { logger } from "#/platform/observability/logger.ts";
import { catalogSeed } from "#/scripts/seed-catalog.ts";
import { marketSeed } from "#/scripts/seed-market.ts";
import { pilotSeed } from "#/scripts/seed-pilot.ts";
import { seedPlanFor, type TSeedPlan } from "#/scripts/seed-plan.ts";

const EXIT_OK = 0;
const EXIT_FAILURE = 1;

const adminUserFor = (password: string): TUserCreateInput => ({
	name: "Admin",
	email: "admin@test.app",
	password,
	role: ROLE.SUPERADMIN,
});

const demoUsersFor = (password: string): readonly TUserCreateInput[] => [
	{ name: "Analyst", email: "analyst@test.app", password, role: ROLE.ANALYST },
	{ name: "Viewer", email: "viewer@test.app", password, role: ROLE.VIEWER },
];

const userEnsure = (
	seedUser: TUserCreateInput,
): Effect.Effect<string, never, TDbServiceId | TAuthServiceId> =>
	Effect.gen(function* () {
		const { db } = yield* DbService;
		const { auth } = yield* AuthService;

		const existing = yield* Effect.promise(() =>
			db.select().from(user).where(eq(user.email, seedUser.email)).limit(1),
		);

		return yield* match(existing[0])
			.with(P.nonNullable, (found) => Effect.succeed(found.id))
			.otherwise(() =>
				Effect.promise(async () => {
					const result = await auth.api.signUpEmail({
						body: {
							email: seedUser.email,
							password: seedUser.password,
							name: seedUser.name,
						},
					});
					await db
						.update(user)
						.set({ role: seedUser.role })
						.where(eq(user.id, result.user.id));
					return result.user.id;
				}),
			);
	});

const demoSeed = (
	password: string,
): Effect.Effect<void, never, TDbServiceId | TAuthServiceId> =>
	Effect.forEach(demoUsersFor(password), userEnsure);

const seedRun = (
	plan: TSeedPlan,
): Effect.Effect<void, never, TDbServiceId | TAuthServiceId> =>
	Effect.gen(function* () {
		const admin = adminUserFor(plan.password);
		const adminId = yield* userEnsure(admin);
		yield* match(plan.demoData)
			.with(true, () => demoSeed(plan.password))
			.otherwise(() => Effect.void);

		const catalog = yield* match(plan.demoData)
			.with(true, () => catalogSeed())
			.otherwise(() => Effect.succeed(null));

		const market = yield* match(plan.demoData)
			.with(true, () => marketSeed())
			.otherwise(() => Effect.succeed(null));

		const pilot = yield* match(plan.demoData)
			.with(true, () => pilotSeed(adminId))
			.otherwise(() => Effect.succeed(null));

		const seeded = match(plan.demoData)
			.with(true, () => [admin, ...demoUsersFor(plan.password)])
			.otherwise(() => [admin]);

		logger.info(
			{
				users: A.map(seeded, (seedUser) => ({
					email: seedUser.email,
					role: seedUser.role,
				})),
				catalog,
				market,
				pilot,
				demoData: plan.demoData,
			},
			"seed finished",
		);
	});

await match(seedPlanFor(env))
	.with(P.nullish, (): Promise<void> => {
		logger.error(
			{ env: env.NODE_ENV },
			"seed refused: SEED_PASSWORD is required to seed a production database",
		);
		process.exit(EXIT_FAILURE);
	})
	.otherwise((plan): Promise<void> => runtime.runPromise(seedRun(plan)));

process.exit(EXIT_OK);
