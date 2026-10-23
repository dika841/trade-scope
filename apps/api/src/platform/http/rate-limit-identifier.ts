import { A } from "@mobily/ts-belt";
import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

const UNKNOWN_IDENTIFIER = "unknown";

export type TRateLimitIdentifierInput = {
	remoteAddress: string | undefined;
	forwardedFor: string | undefined;
	trustedProxyIps: readonly string[];
};

const forwardedAddressFirst = (
	forwardedFor: string | undefined,
): string | undefined => forwardedFor?.split(",")[0]?.trim() || undefined;

export const rateLimitIdentifierFrom = (
	input: TRateLimitIdentifierInput,
): string => {
	const remoteAddress = input.remoteAddress ?? UNKNOWN_IDENTIFIER;
	return A.includes(input.trustedProxyIps, remoteAddress)
		? (forwardedAddressFirst(input.forwardedFor) ?? remoteAddress)
		: remoteAddress;
};

export const rateLimitIdentifierOf = (
	context: Context,
	trustedProxyIps: readonly string[],
): string =>
	rateLimitIdentifierFrom({
		remoteAddress: getConnInfo(context).remote.address,
		forwardedFor: context.req.header("x-forwarded-for"),
		trustedProxyIps,
	});
