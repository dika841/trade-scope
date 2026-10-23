export const DATABASE_DRIVER = {
	NODE: "node",
	NEON: "neon",
} as const;

export type TDatabaseDriver =
	(typeof DATABASE_DRIVER)[keyof typeof DATABASE_DRIVER];

export const REDIS_DRIVER = {
	NODE: "node",
	UPSTASH: "upstash",
} as const;

export type TRedisDriver = (typeof REDIS_DRIVER)[keyof typeof REDIS_DRIVER];
