import type { TJobHandler } from "@app/queue";
import { logger } from "#/platform/observability/logger.ts";

export type TExampleJobPayload = {
	subjectId: string;
};

/**
 * Placeholder handler for the queue wiring. Replace it with the first real job
 * (for example a trade-data ingestion part) before enabling the worker in
 * production.
 */
export const exampleJobProcess: TJobHandler<TExampleJobPayload> = async (
	payload,
): Promise<void> => {
	logger.info({ subjectId: payload.subjectId }, "processing job");
};
