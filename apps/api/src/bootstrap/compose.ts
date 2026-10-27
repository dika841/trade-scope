import { Layer, ManagedRuntime } from "effect";
import { activityModule } from "#/activity/index.ts";
import { authModule } from "#/auth/index.ts";
import { catalogModule } from "#/catalog/index.ts";
import { dataSourceModule } from "#/data-source/index.ts";
import { healthModule } from "#/health/index.ts";
import { ingestionModule } from "#/ingestion/index.ts";
import { marketModule } from "#/market/index.ts";
import { pilotModule } from "#/pilot/index.ts";
import { reportModule } from "#/report/index.ts";
import { cacheServiceLayer } from "#/platform/cache/redis.ts";
import { dbServiceLayer } from "#/platform/db/db-service.ts";
import { mailServiceLayer } from "#/platform/mail/mailer.ts";
import { queueServiceLayer } from "#/platform/queue/rabbitmq.ts";
import { roleModule } from "#/role/index.ts";
import { userModule } from "#/user/index.ts";

export const AppLayer = Layer.mergeAll(
	dbServiceLayer,
	cacheServiceLayer,
	queueServiceLayer,
	mailServiceLayer,
	healthModule.layer,
	activityModule.layer,
	roleModule.layer,
	catalogModule.layer,
	dataSourceModule.layer,
	ingestionModule.layer,
	marketModule.layer,
	pilotModule.layer,
	reportModule.layer,
	userModule.layer,
	authModule.layer,
);

export const appMemoMap = Layer.makeMemoMapUnsafe();

export const runtime = ManagedRuntime.make(AppLayer, { memoMap: appMemoMap });

export type TAppRuntime = typeof runtime;

export type TAppRuntimeServices = Layer.Success<typeof AppLayer>;
