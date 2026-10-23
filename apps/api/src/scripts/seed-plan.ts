import { match, P } from "ts-pattern";
import { NODE_ENV, type TEnv } from "#/platform/config/env-schema.ts";

export const SEED_PASSWORD_DEFAULT = "Password123";

export type TSeedPlan = {
	password: string;
	demoData: boolean;
};

type TSeedEnv = Pick<TEnv, "NODE_ENV" | "SEED_PASSWORD">;

export const seedPlanFor = (env: TSeedEnv): TSeedPlan | null =>
	match({
		configured: env.SEED_PASSWORD,
		production: env.NODE_ENV === NODE_ENV.PRODUCTION,
	})
		.with(
			{ production: true, configured: P.string },
			({ configured }): TSeedPlan => ({
				password: configured,
				demoData: false,
			}),
		)
		.with({ production: true }, (): null => null)
		.with(
			{ configured: P.string },
			({ configured }): TSeedPlan => ({ password: configured, demoData: true }),
		)
		.otherwise(
			(): TSeedPlan => ({ password: SEED_PASSWORD_DEFAULT, demoData: true }),
		);
