export type TJobDedupe = {
	claim: (messageId: string) => Promise<boolean>;
	release: (messageId: string) => Promise<void>;
};
