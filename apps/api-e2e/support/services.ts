const E2E_PORT = Number(process.env.E2E_PORT ?? 3107);
const FALLBACK = {
	DATABASE: "postgres://app:app@localhost:5432/app",
	REDIS: "redis://localhost:6380",
	RABBITMQ: "amqp://app:app@localhost:5672",
} as const;

const E2E_DATABASE_NAME = "app_e2e";

const withDatabase = (url: string, name: string): string =>
	url.replace(/\/[^/]+$/, `/${name}`);

export const BASE_DATABASE_URL = process.env.DATABASE_URL ?? FALLBACK.DATABASE;

export const E2E_DATABASE_URL = withDatabase(
	BASE_DATABASE_URL,
	E2E_DATABASE_NAME,
);

export const ADMIN_DATABASE_URL = withDatabase(BASE_DATABASE_URL, "postgres");

export const REDIS_URL = process.env.REDIS_URL ?? FALLBACK.REDIS;

export const RABBITMQ_URL = process.env.RABBITMQ_URL ?? FALLBACK.RABBITMQ;

export const API_PORT = E2E_PORT;

export const apiEnv = (
	overrides: Record<string, string>,
): Record<string, string> => ({
	...(process.env as Record<string, string>),
	NODE_ENV: "test",
	PORT: String(E2E_PORT),
	DATABASE_DRIVER: "node",
	DATABASE_URL: E2E_DATABASE_URL,
	REDIS_DRIVER: "node",
	REDIS_URL,
	RABBITMQ_URL,
	RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ?? "10000",
	BETTER_AUTH_URL: `http://127.0.0.1:${E2E_PORT}`,
	BETTER_AUTH_SECRET: "e2e-test-secret-please-do-not-use-in-prod",
	WEB_ORIGIN: "http://localhost:5173",
	...overrides,
});
