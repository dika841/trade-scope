import { match, P } from "ts-pattern";
import type { TCacheClient } from "./cache-client.ts";

export type TDecoder<TValue> = (value: unknown) => TValue | null;

export type TCache = {
	get: <TValue>(
		key: string,
		decode: TDecoder<TValue>,
	) => Promise<TValue | null>;
	set: <TValue>(
		key: string,
		value: TValue,
		ttlSeconds: number,
	) => Promise<void>;
	del: (key: string) => Promise<void>;
};

type TParsed = { ok: true; value: unknown } | { ok: false };

const jsonParse = (raw: string): TParsed => {
	try {
		return { ok: true, value: JSON.parse(raw) };
	} catch {
		return { ok: false };
	}
};

const decodeRaw = <TValue>(
	raw: string | null,
	decode: TDecoder<TValue>,
): TValue | null =>
	match(raw)
		.with(P.nullish, (): TValue | null => null)
		.otherwise((found): TValue | null =>
			match(jsonParse(found))
				.with({ ok: true }, ({ value }): TValue | null => decode(value))
				.otherwise((): TValue | null => null),
		);

export const cacheCreate = (client: TCacheClient): TCache => {
	const get = async <TValue>(
		key: string,
		decode: TDecoder<TValue>,
	): Promise<TValue | null> => decodeRaw(await client.get(key), decode);

	const set = async <TValue>(
		key: string,
		value: TValue,
		ttlSeconds: number,
	): Promise<void> => {
		await client.setex(key, ttlSeconds, JSON.stringify(value));
	};

	const del = async (key: string): Promise<void> => {
		await client.del(key);
	};

	return { get, set, del };
};
