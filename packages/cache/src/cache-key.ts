import { A } from "@mobily/ts-belt";

export const CACHE_KEY_SEPARATOR = ":";

export const CACHE_NAMESPACE = {
	RATE_LIMIT: "rate-limit",
	JOB_DEDUPE: "job-dedupe",
} as const;

export type TCacheNamespace =
	(typeof CACHE_NAMESPACE)[keyof typeof CACHE_NAMESPACE];

export const cacheKeyCreate = (
	namespace: TCacheNamespace,
	...parts: readonly string[]
): string => A.join([namespace, ...parts], CACHE_KEY_SEPARATOR);
