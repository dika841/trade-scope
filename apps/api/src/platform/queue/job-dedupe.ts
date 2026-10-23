import { CACHE_NAMESPACE, cacheKeyCreate, type TCacheClient } from "@app/cache";
import type { TJobDedupe } from "@app/queue";

export const JOB_DEDUPE_TTL_SECONDS = 86_400;

const CLAIMED = "1";

export const jobDedupeCreate = (
	client: TCacheClient,
	ttlSeconds: number = JOB_DEDUPE_TTL_SECONDS,
): TJobDedupe => {
	const keyOf = (messageId: string): string =>
		cacheKeyCreate(CACHE_NAMESPACE.JOB_DEDUPE, messageId);

	const claim = (messageId: string): Promise<boolean> =>
		client.setIfAbsent(keyOf(messageId), ttlSeconds, CLAIMED);

	const release = async (messageId: string): Promise<void> => {
		await client.del(keyOf(messageId));
	};

	return { claim, release };
};
