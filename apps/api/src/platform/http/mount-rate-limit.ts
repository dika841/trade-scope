import type { TCacheClient } from "@app/cache";
import type { Hono } from "hono";
import { env } from "#/platform/config/env.ts";
import { rateLimit } from "#/platform/http/rate-limit.ts";
import { RATE_LIMIT_SCOPE } from "#/platform/http/rate-limit-scopes.ts";
import { ROUTE_PREFIX } from "#/platform/http/route-paths.ts";

export const rateLimitMount = (app: Hono, client: TCacheClient): void => {
	app.use(
		`${ROUTE_PREFIX.AUTH}/*`,
		rateLimit({
			client,
			scope: RATE_LIMIT_SCOPE.AUTH,
			windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
			max: env.RATE_LIMIT_MAX,
			trustedProxyIps: env.RATE_LIMIT_TRUSTED_PROXY_IPS,
		}),
	);
};
