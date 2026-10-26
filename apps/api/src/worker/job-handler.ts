import type { TJobHandler } from "@app/queue";
import { runtime } from "#/bootstrap/compose.ts";
import { ingestionProcess } from "#/ingestion/index.ts";
import type { TIngestionJobPayload } from "#/ingestion/index.ts";

/**
 * The API queues a run and the worker processes it. The handler resolves the
 * run from the database, so a message still means the same thing after the API
 * has restarted.
 */
export const ingestionJobProcess: TJobHandler<TIngestionJobPayload> = async (
	payload,
): Promise<void> => {
	await runtime.runPromise(ingestionProcess(payload.runId));
};
