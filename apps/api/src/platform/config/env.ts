import { envSchema, type TEnv } from "#/platform/config/env-schema.ts";

export type { TEnv } from "#/platform/config/env-schema.ts";

let parsed: TEnv | null = null;

const envRead = (): TEnv => {
	parsed ??= envSchema.parse(process.env);
	return parsed;
};

export const env: TEnv = new Proxy({} as TEnv, {
	get: (_target, key: string): unknown => envRead()[key as keyof TEnv],
});
