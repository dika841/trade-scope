import { Effect } from "effect";

export const closeQuietly = (
	close: () => Promise<unknown>,
): Effect.Effect<void> =>
	Effect.tryPromise({ try: close, catch: (cause): unknown => cause }).pipe(
		Effect.asVoid,
		Effect.catch((): Effect.Effect<void> => Effect.void),
	);
