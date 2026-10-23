import type { RouterClient } from "@orpc/server";
import type { TAppRouter } from "#/bootstrap/router.ts";

export type { TSession, TSessionUser } from "#/shared/session.ts";
export type { TAppRouter } from "#/bootstrap/router.ts";
export type TAppRouterClient = RouterClient<TAppRouter>;
