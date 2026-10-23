import { match } from "ts-pattern";
import type { TJobDedupe } from "./job-dedupe.ts";

export type TJobDedupeFake = TJobDedupe & {
	claimed: Set<string>;
};

export const jobDedupeFake = (): TJobDedupeFake => {
	const claimed = new Set<string>();

	const claim = async (messageId: string): Promise<boolean> =>
		match(claimed.has(messageId))
			.with(true, (): boolean => false)
			.otherwise((): boolean => {
				claimed.add(messageId);
				return true;
			});

	const release = async (messageId: string): Promise<void> => {
		claimed.delete(messageId);
	};

	return { claimed, claim, release };
};
