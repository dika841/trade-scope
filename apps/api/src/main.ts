import "#/bootstrap/polyfill.ts";

import { serve } from "@hono/node-server";
import { Effect } from "effect";
import { Hono } from "hono";
import { match, P } from "ts-pattern";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { runtime } from "#/bootstrap/compose.ts";
import { tracing } from "#/bootstrap/tracing.ts";
import {
	SHUTDOWN_SIGNAL,
	SHUTDOWN_STEP,
	shutdownOn,
	shutdownRun,
} from "#/platform/shutdown.ts";
import { AuthService } from "#/auth/infrastructure/auth-service.ts";
import { CacheService } from "#/platform/cache/redis.ts";
import { env } from "#/platform/config/env.ts";
import { apiReferenceEnabledOf } from "#/platform/config/env-schema.ts";
import { logger } from "#/platform/observability/logger.ts";
import { metrics } from "#/platform/observability/metrics.ts";
import { authMount } from "#/auth/presentation/mount-auth.ts";
import { healthModule, healthMount } from "#/health/index.ts";
import { orpcMount } from "#/platform/http/mount-orpc.ts";
import { metricsMount } from "#/platform/http/mount-metrics.ts";
import { observabilityMount } from "#/platform/http/mount-observability.ts";
import { rateLimitMount } from "#/platform/http/mount-rate-limit.ts";
import { webDistMount } from "#/platform/http/mount-web-dist.ts";
import type { TORPCContext } from "#/platform/orpc/context.ts";
import {
	SESSION_STATE,
	type TSession,
	type TSessionState,
} from "#/shared/session.ts";
import { routerBuild } from "#/bootstrap/router.ts";

const { auth } = await runtime.runPromise(
	AuthService.use((service) => Effect.succeed(service)),
);

const { client: cacheClient } = await runtime.runPromise(
	CacheService.use((service) => Effect.succeed(service)),
);

const router = routerBuild();

type TSessionResolution = {
	session: TSession | null;
	sessionState: TSessionState;
};

const SESSION_UNAVAILABLE: TSessionResolution = {
	session: null,
	sessionState: SESSION_STATE.UNAVAILABLE,
};

const sessionResolutionOf = (session: TSession | null): TSessionResolution =>
	match(session)
		.with(
			P.nullish,
			(): TSessionResolution => ({
				session: null,
				sessionState: SESSION_STATE.ANONYMOUS,
			}),
		)
		.otherwise(
			(found): TSessionResolution => ({
				session: found,
				sessionState: SESSION_STATE.RESOLVED,
			}),
		);

const sessionResolve = (headers: Headers): Promise<TSessionResolution> =>
	runtime.runPromise(
		AuthService.use((service) => service.getSession(headers)).pipe(
			Effect.map(sessionResolutionOf),
			Effect.catch((cause): Effect.Effect<TSessionResolution> => {
				logger.error({ err: cause }, "session.resolve.failed");
				return Effect.succeed(SESSION_UNAVAILABLE);
			}),
		),
	);

const buildContext = async (headers: Headers): Promise<TORPCContext> => {
	const resolution = await sessionResolve(headers);

	return {
		headers,
		session: resolution.session,
		sessionState: resolution.sessionState,
		permissions: resolution.session?.permissions ?? [],
		runtime,
	};
};

const EXIT_OK = 0;
const EXIT_FAILURE = 1;

const app = new Hono();

app.use("*", requestId());

observabilityMount(app, { logger, metrics, tracing });

app.use(
	"*",
	cors({
		origin: env.WEB_ORIGIN,
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
);

healthMount(app, {
	readiness: () => runtime.runPromise(healthModule.readiness()),
});
metricsMount(app, {
	metrics,
	enabled: env.METRICS_ENABLED,
	token: env.METRICS_TOKEN,
});
rateLimitMount(app, cacheClient);
authMount(app, auth);
orpcMount({
	app,
	router,
	logger,
	referenceEnabled: apiReferenceEnabledOf(env),
	buildContext,
});
webDistMount(app, env.WEB_DIST_PATH);

const server = serve({ fetch: app.fetch, port: env.PORT }, (info): void => {
	logger.info({ port: info.port }, "api listening");
});

const serverClose = (): Promise<void> =>
	new Promise((resolve): void => {
		server.close((): void => resolve());
	});

shutdownOn(
	[SHUTDOWN_SIGNAL.TERM, SHUTDOWN_SIGNAL.INT],
	async (signal): Promise<void> => {
		logger.info({ signal }, "api stopping");

		const drained = await shutdownRun({
			logger,
			steps: [
				{ name: SHUTDOWN_STEP.HTTP, close: serverClose },
				{
					name: SHUTDOWN_STEP.RUNTIME,
					close: (): Promise<void> => runtime.dispose(),
				},
				{
					name: SHUTDOWN_STEP.TRACING,
					close: (): Promise<void> => tracing.shutdown(),
				},
			],
		});

		process.exit(drained ? EXIT_OK : EXIT_FAILURE);
	},
);
