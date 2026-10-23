import type { TMe } from "@app/schemas";
import { Store } from "@tanstack/store";
import {
	SESSION_REACH,
	type TSessionResolution,
} from "#/libs/auth/session-reach.ts";

const SESSION_UNRESOLVED: TSessionResolution = {
	reach: SESSION_REACH.UNREACHABLE,
	session: null,
};

export const sessionStore = new Store<TSessionResolution>(SESSION_UNRESOLVED);

export const sessionResolutionSet = (resolution: TSessionResolution): void => {
	sessionStore.setState(() => resolution);
};

export const sessionSet = (me: TMe | null): void =>
	sessionResolutionSet({ reach: SESSION_REACH.REACHED, session: me });

export const sessionClear = (): void => sessionSet(null);
