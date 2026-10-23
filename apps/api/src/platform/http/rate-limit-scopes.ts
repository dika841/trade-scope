export const RATE_LIMIT_SCOPE = {
	AUTH: "auth",
} as const;

export type TRateLimitScope =
	(typeof RATE_LIMIT_SCOPE)[keyof typeof RATE_LIMIT_SCOPE];
