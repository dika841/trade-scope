import {
	type ServeStaticOptions,
	serveStatic,
} from "@hono/node-server/serve-static";
import type { Hono, MiddlewareHandler } from "hono";
import { match, P } from "ts-pattern";

const CACHE_CONTROL_HEADER = "Cache-Control";
const HASHED_ASSET_PREFIX = "/assets/";
const ONE_YEAR_SECONDS = 31_536_000;

const CACHE_CONTROL = {
	IMMUTABLE: `public, max-age=${ONE_YEAR_SECONDS}, immutable`,
	REVALIDATE: "no-cache",
} as const;

const cacheControlFor = (requestPath: string): string =>
	match(requestPath)
		.with(
			P.string.startsWith(HASHED_ASSET_PREFIX),
			(): string => CACHE_CONTROL.IMMUTABLE,
		)
		.otherwise((): string => CACHE_CONTROL.REVALIDATE);

const cachedStatic = (options: ServeStaticOptions): MiddlewareHandler => {
	const serve = serveStatic(options);

	return async (context, next): Promise<Response | undefined> => {
		const served = await serve(context, next);

		return match(served)
			.with(P.instanceOf(Response), (response): Response => {
				response.headers.set(
					CACHE_CONTROL_HEADER,
					cacheControlFor(context.req.path),
				);
				return response;
			})
			.otherwise((): undefined => undefined);
	};
};

export const webDistMount = (
	app: Hono,
	webDistPath: string | undefined,
): void => {
	match(webDistPath)
		.with(P.nullish, () => undefined)
		.otherwise((path) => {
			app.use("/*", cachedStatic({ root: path }));
			app.get("*", cachedStatic({ path: `${path}/index.html` }));
		});
};
