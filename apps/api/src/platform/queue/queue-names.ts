const TEST_ENV = "test";
const TEST_SUFFIX = ".test";

const queueName = (base: string): string =>
	process.env.NODE_ENV === TEST_ENV ? `${base}${TEST_SUFFIX}` : base;

export const QUEUE_NAME = {
	INGESTION: queueName("ingestion"),
} as const;

export type TQueueName = (typeof QUEUE_NAME)[keyof typeof QUEUE_NAME];
