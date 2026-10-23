import { match } from "ts-pattern";
import type { TCacheClient } from "./cache-client.ts";
import { CACHE_NAMESPACE, cacheKeyCreate } from "./cache-key.ts";

export type TRateLimitInput = {
	identifier: string;
	scope: string;
	windowSeconds: number;
	max: number;
};

export type TRateLimitResult = {
	allowed: boolean;
	count: number;
	remaining: number;
};

const FIRST_HIT = 1;
const NO_REMAINING = 0;

export const rateLimitCheck = async (
	client: TCacheClient,
	input: TRateLimitInput,
): Promise<TRateLimitResult> => {
	const key = cacheKeyCreate(
		CACHE_NAMESPACE.RATE_LIMIT,
		input.scope,
		input.identifier,
	);

	const count = await client.incr(key);

	await match(count)
		.with(
			FIRST_HIT,
			(): Promise<unknown> => client.expire(key, input.windowSeconds),
		)
		.otherwise((): Promise<unknown> => Promise.resolve(undefined));

	return {
		allowed: count <= input.max,
		count,
		remaining: Math.max(input.max - count, NO_REMAINING),
	};
};
