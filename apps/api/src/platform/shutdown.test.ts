import { describe, expect, it, vi } from "vitest";
import {
	SHUTDOWN_EVENT,
	SHUTDOWN_STEP,
	type TShutdownLogger,
	shutdownRun,
} from "#/platform/shutdown.ts";

const TIMEOUT_MS = 20;
const NEVER_MS = 5_000;

type TLoggerFake = TShutdownLogger & {
	errors: string[];
	messages: string[];
};

const loggerFake = (): TLoggerFake => {
	const errors: string[] = [];
	const messages: string[] = [];

	return {
		errors,
		messages,
		info: (_data, message): void => {
			messages.push(message);
		},
		error: (_data, message): void => {
			errors.push(message);
		},
	};
};

describe("shutdownRun", () => {
	it("closes every step in the order it was given", async (): Promise<void> => {
		const closed: string[] = [];
		const logger = loggerFake();

		const drained = await shutdownRun({
			logger,
			steps: [
				{
					name: SHUTDOWN_STEP.HTTP,
					close: async (): Promise<void> => {
						closed.push(SHUTDOWN_STEP.HTTP);
					},
				},
				{
					name: SHUTDOWN_STEP.RUNTIME,
					close: async (): Promise<void> => {
						closed.push(SHUTDOWN_STEP.RUNTIME);
					},
				},
			],
		});

		expect(drained).toBe(true);
		expect(closed).toEqual([SHUTDOWN_STEP.HTTP, SHUTDOWN_STEP.RUNTIME]);
		expect(logger.messages).toContain(SHUTDOWN_EVENT.FINISHED);
	});

	it("keeps closing the later steps when an earlier one fails", async (): Promise<void> => {
		const logger = loggerFake();
		const tracing = vi.fn(async (): Promise<void> => undefined);

		const drained = await shutdownRun({
			logger,
			steps: [
				{
					name: SHUTDOWN_STEP.RUNTIME,
					close: async (): Promise<void> => {
						throw new Error("pool already gone");
					},
				},
				{ name: SHUTDOWN_STEP.TRACING, close: tracing },
			],
		});

		expect(drained).toBe(true);
		expect(tracing).toHaveBeenCalledTimes(1);
		expect(logger.errors).toContain(SHUTDOWN_EVENT.STEP_FAILED);
	});

	it("gives up on a step that never settles rather than hanging the process", async (): Promise<void> => {
		const logger = loggerFake();

		const drained = await shutdownRun({
			logger,
			timeoutMs: TIMEOUT_MS,
			steps: [
				{
					name: SHUTDOWN_STEP.BROKER,
					close: (): Promise<void> =>
						new Promise((resolve): void => {
							setTimeout(resolve, NEVER_MS).unref();
						}),
				},
			],
		});

		expect(drained).toBe(false);
		expect(logger.errors).toContain(SHUTDOWN_EVENT.TIMED_OUT);
	});
});
