export const QUEUE_NAME_SEPARATOR = ".";

export const QUEUE_SUFFIX = {
	RETRY: "retry",
	DEAD_LETTER: "dlq",
} as const;

export type TQueueSuffix = (typeof QUEUE_SUFFIX)[keyof typeof QUEUE_SUFFIX];

const suffixed = (name: string, suffix: TQueueSuffix): string =>
	`${name}${QUEUE_NAME_SEPARATOR}${suffix}`;

export const retryQueueNameOf = (name: string): string =>
	suffixed(name, QUEUE_SUFFIX.RETRY);

export const deadLetterQueueNameOf = (name: string): string =>
	suffixed(name, QUEUE_SUFFIX.DEAD_LETTER);
