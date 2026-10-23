import { A } from "@mobily/ts-belt";
import { match } from "ts-pattern";

export const SHUTDOWN_TIMEOUT_MS = 10_000;

export const SHUTDOWN_SIGNAL = {
	TERM: "SIGTERM",
	INT: "SIGINT",
} as const;

export type TShutdownSignal =
	(typeof SHUTDOWN_SIGNAL)[keyof typeof SHUTDOWN_SIGNAL];

export const SHUTDOWN_STEP = {
	HTTP: "http",
	BROKER: "broker",
	RUNTIME: "runtime",
	TRACING: "tracing",
} as const;

export type TShutdownStepName =
	(typeof SHUTDOWN_STEP)[keyof typeof SHUTDOWN_STEP];

export const SHUTDOWN_EVENT = {
	STARTED: "shutdown.started",
	STEP_FAILED: "shutdown.step.failed",
	TIMED_OUT: "shutdown.timed_out",
	FINISHED: "shutdown.finished",
} as const;

export type TShutdownStep = {
	name: TShutdownStepName;
	close: () => Promise<unknown>;
};

export type TShutdownLogger = {
	info: (data: Record<string, unknown>, message: string) => void;
	error: (data: Record<string, unknown>, message: string) => void;
};

export type TShutdownOptions = {
	logger: TShutdownLogger;
	steps: readonly TShutdownStep[];
	timeoutMs?: number;
};

const stepRun = async (
	logger: TShutdownLogger,
	step: TShutdownStep,
): Promise<void> => {
	try {
		await step.close();
	} catch (cause) {
		logger.error({ err: cause, step: step.name }, SHUTDOWN_EVENT.STEP_FAILED);
	}
};

const stepsRun = (options: TShutdownOptions): Promise<void> =>
	A.reduce(
		options.steps,
		Promise.resolve(),
		(chain, step): Promise<void> =>
			chain.then((): Promise<void> => stepRun(options.logger, step)),
	);

const timeoutAfter = (timeoutMs: number): Promise<void> =>
	new Promise((resolve): void => {
		setTimeout(resolve, timeoutMs).unref();
	});

export const shutdownRun = async (
	options: TShutdownOptions,
): Promise<boolean> => {
	const timeoutMs = options.timeoutMs ?? SHUTDOWN_TIMEOUT_MS;
	const names = A.map(options.steps, (step): string => step.name);

	options.logger.info({ steps: names, timeoutMs }, SHUTDOWN_EVENT.STARTED);

	const state = { finished: false };

	await Promise.race([
		stepsRun(options).then((): void => {
			state.finished = true;
		}),
		timeoutAfter(timeoutMs),
	]);

	return match(state.finished)
		.with(false, (): boolean => {
			options.logger.error({ timeoutMs }, SHUTDOWN_EVENT.TIMED_OUT);
			return false;
		})
		.otherwise((): boolean => {
			options.logger.info({}, SHUTDOWN_EVENT.FINISHED);
			return true;
		});
};

export const shutdownOn = (
	signals: readonly TShutdownSignal[],
	run: (signal: TShutdownSignal) => Promise<void>,
): void => {
	const state = { started: false };

	A.forEach(signals, (signal): void => {
		process.once(signal, (): void => {
			match(state.started)
				.with(true, (): void => undefined)
				.otherwise((): void => {
					state.started = true;
					void run(signal);
				});
		});
	});
};
