export const QUEUE_NAME = {
	EXAMPLE: "example",
} as const;

export type TQueueName = (typeof QUEUE_NAME)[keyof typeof QUEUE_NAME];
