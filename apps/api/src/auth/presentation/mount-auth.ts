import type { Hono } from "hono";
import type { TAuthHandler } from "#/auth/domain/auth-handler.ts";
import { HTTP_METHOD } from "#/platform/http/http-methods.ts";
import { ROUTE_PREFIX } from "#/platform/http/route-paths.ts";

export const authMount = (app: Hono, auth: TAuthHandler): void => {
	app.on(
		[HTTP_METHOD.GET, HTTP_METHOD.POST],
		`${ROUTE_PREFIX.AUTH}/*`,
		(context) => auth.handler(context.req.raw),
	);
};
