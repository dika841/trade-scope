import { Context, Effect, Layer, ManagedRuntime } from "effect";
import { describe, expect, it } from "vitest";
import { closeQuietly } from "#/platform/resource-close.ts";

const PROBE_TAG = "app/CloseProbe";

type TProbe = { readonly marker: string };
type TProbeId = { readonly _: unique symbol };

const Probe = Context.Service<TProbeId, TProbe>(PROBE_TAG);

describe("closeQuietly", () => {
	it("succeeds when the underlying close rejects, so one finalizer cannot fail the rest", async (): Promise<void> => {
		const result = await Effect.runPromise(
			closeQuietly(
				(): Promise<void> => Promise.reject(new Error("ECONNRESET")),
			),
		);

		expect(result).toBeUndefined();
	});
});

describe("ManagedRuntime disposal", () => {
	it("runs a layer finalizer, which is what the shutdown steps rely on", async (): Promise<void> => {
		const closed: string[] = [];

		const probeLayer = Layer.effect(
			Probe,
			Effect.gen(function* () {
				const probe = yield* Effect.acquireRelease(
					Effect.sync((): TProbe => ({ marker: PROBE_TAG })),
					(found): Effect.Effect<void> =>
						closeQuietly(async (): Promise<void> => {
							closed.push(found.marker);
						}),
				);

				return Probe.of(probe);
			}),
		);

		const runtime = ManagedRuntime.make(probeLayer, {
			memoMap: Layer.makeMemoMapUnsafe(),
		});

		await runtime.runPromise(
			Probe.use((found) => Effect.succeed(found.marker)),
		);

		expect(closed).toEqual([]);

		await runtime.dispose();

		expect(closed).toEqual([PROBE_TAG]);
	});
});
