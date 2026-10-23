export type TCacheClient = {
	ping: () => Promise<string>;
	get: (key: string) => Promise<string | null>;
	setex: (key: string, seconds: number, value: string) => Promise<unknown>;
	setIfAbsent: (
		key: string,
		seconds: number,
		value: string,
	) => Promise<boolean>;
	del: (key: string) => Promise<number>;
	incr: (key: string) => Promise<number>;
	expire: (key: string, seconds: number) => Promise<number>;
};
