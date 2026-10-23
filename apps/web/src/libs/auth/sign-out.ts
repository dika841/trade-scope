import type { QueryClient } from "@tanstack/react-query";
import { match, P } from "ts-pattern";

export type TSignOutResult = { error?: unknown };

export type TSignOutDeps = {
	signOut: () => Promise<TSignOutResult>;
	queryClient: QueryClient;
	onSignedOut: () => void;
	onFailure: () => void;
};

const attempt = async (signOut: TSignOutDeps["signOut"]): Promise<boolean> =>
	signOut()
		.then(({ error }): boolean =>
			match(error)
				.with(P.nullish, (): boolean => true)
				.otherwise((): boolean => false),
		)
		.catch((): boolean => false);

export const signOutPerform = async (deps: TSignOutDeps): Promise<void> =>
	match(await attempt(deps.signOut))
		.with(false, (): void => deps.onFailure())
		.otherwise((): void => {
			deps.queryClient.clear();
			deps.onSignedOut();
		});
