import { match } from "ts-pattern";

const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
const MINUTE_MS = MS_PER_SECOND * SECONDS_PER_MINUTE;
const HOUR_MS = MINUTE_MS * SECONDS_PER_MINUTE;
const DECIMAL_PLACES = 1;

const secondsLabel = (ms: number): string =>
	`${(ms / MS_PER_SECOND).toFixed(DECIMAL_PLACES)}s`;

export const formatDurationMs = (ms: number): string =>
	match(ms)
		.when(
			(value): boolean => value < MS_PER_SECOND,
			(): string => `${Math.max(ms, 0)} ms`,
		)
		.when(
			(value): boolean => value < MINUTE_MS,
			(): string => secondsLabel(ms),
		)
		.when(
			(value): boolean => value < HOUR_MS,
			(): string =>
				`${Math.floor(ms / MINUTE_MS)}m ${Math.round((ms % MINUTE_MS) / MS_PER_SECOND)}s`,
		)
		.otherwise(
			(): string =>
				`${Math.floor(ms / HOUR_MS)}h ${Math.round((ms % HOUR_MS) / MINUTE_MS)}m`,
		);

export const formatDuration = (
	startedAt: string | null,
	finishedAt: string | null,
): string =>
	match(startedAt)
		.with(null, (): string => "-")
		.otherwise((start): string =>
			formatDurationMs(
				new Date(finishedAt ?? Date.now()).getTime() -
					new Date(start).getTime(),
			),
		);
