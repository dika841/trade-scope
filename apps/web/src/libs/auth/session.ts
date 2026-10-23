import { ORPCError } from "@orpc/client";
import { match } from "ts-pattern";
import {
	SESSION_REACH,
	type TSessionResolution,
} from "#/libs/auth/session-reach.ts";
import { sessionResolutionSet } from "#/libs/auth/session-store.ts";
import { orpc } from "#/libs/orpc/client.ts";

const SERVER_ERROR_STATUS = 500;

const SIGNED_OUT: TSessionResolution = {
	reach: SESSION_REACH.REACHED,
	session: null,
};

const UNREACHABLE: TSessionResolution = {
	reach: SESSION_REACH.UNREACHABLE,
	session: null,
};

const isORPCError = (error: unknown): error is ORPCError<string, unknown> =>
	error instanceof ORPCError;

const classify = (error: unknown): TSessionResolution =>
	match(error)
		.when(isORPCError, (failure) =>
			match(failure.status < SERVER_ERROR_STATUS)
				.with(true, () => SIGNED_OUT)
				.otherwise(() => UNREACHABLE),
		)
		.otherwise(() => UNREACHABLE);

export const sessionResolve = async (): Promise<TSessionResolution> => {
	try {
		return {
			reach: SESSION_REACH.REACHED,
			session: await orpc.me.get.call(),
		};
	} catch (error) {
		console.error("session resolution failed", error);
		return classify(error);
	}
};

export const sessionRefresh = async (): Promise<TSessionResolution> => {
	const resolution = await sessionResolve();
	sessionResolutionSet(resolution);
	return resolution;
};
