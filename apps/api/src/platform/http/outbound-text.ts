import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { DATA_SOURCE_MESSAGE } from "@app/messages";
import { Effect } from "effect";
import { EBadRequest, EUpstream } from "#/shared/errors.ts";

const FETCH_TIMEOUT_MS = 15_000;
const ALLOWED_PROTOCOLS: readonly string[] = ["http:", "https:"];
const IPV4_OCTET_COUNT = 4;
const IPV4_MAX = 255;
const PRIVATE_IPV4_RANGES: readonly (readonly [number, number])[] = [
	[0, 0],
	[10, 10],
	[100, 64],
	[127, 127],
	[169, 254],
	[172, 16],
	[192, 0],
	[192, 168],
	[198, 18],
	[224, 239],
	[240, 255],
];

type TOctets = readonly [number, number, number, number];

const octetsOf = (address: string): TOctets | null => {
	const parts = address.split(".");
	if (parts.length !== IPV4_OCTET_COUNT) {
		return null;
	}

	const parsed = parts.map((part) => Number(part));
	return parsed.every(
		(value) => Number.isInteger(value) && value >= 0 && value <= IPV4_MAX,
	)
		? (parsed as unknown as TOctets)
		: null;
};

const ipv4IsPrivate = (address: string): boolean => {
	const octets = octetsOf(address);
	if (octets === null) {
		return true;
	}

	const [first, second] = octets;
	return PRIVATE_IPV4_RANGES.some(([from, to]) => {
		if (first === 100) {
			return second >= 64 && second <= 127;
		}

		if (first === 172) {
			return second >= 16 && second <= 31;
		}

		if (first === 198) {
			return second >= 18 && second <= 19;
		}

		return first >= from && first <= to;
	});
};

const ipv6IsPrivate = (address: string): boolean => {
	const normalized = address.toLowerCase();
	const mapped = normalized.startsWith("::ffff:")
		? normalized.slice("::ffff:".length)
		: null;

	if (mapped !== null && isIP(mapped) === 4) {
		return ipv4IsPrivate(mapped);
	}

	return (
		normalized === "::1" ||
		normalized === "::" ||
		normalized.startsWith("fc") ||
		normalized.startsWith("fd") ||
		normalized.startsWith("fe80") ||
		normalized.startsWith("2001:db8")
	);
};

export const isPrivateAddress = (address: string): boolean => {
	const version = isIP(address);

	if (version === 4) {
		return ipv4IsPrivate(address);
	}

	if (version === 6) {
		return ipv6IsPrivate(address);
	}

	return true;
};

type TLookupAddress = {
	address: string;
	family: number;
};

const addressesFor = async (hostname: string): Promise<TLookupAddress[]> =>
	lookup(hostname, { all: true, verbatim: true });

const unsafeUrl = (): EBadRequest =>
	new EBadRequest({ message: DATA_SOURCE_MESSAGE.BLOCKED_URL });

const urlCheck = async (value: string): Promise<URL> => {
	const url = new URL(value);

	if (!ALLOWED_PROTOCOLS.some((protocol) => protocol === url.protocol)) {
		throw new EBadRequest({ message: DATA_SOURCE_MESSAGE.URL_PROTOCOL });
	}

	const addresses = await addressesFor(url.hostname).catch((): never => {
		throw new EBadRequest({ message: DATA_SOURCE_MESSAGE.BLOCKED_URL });
	});

	if (
		addresses.length === 0 ||
		addresses.some((item) => isPrivateAddress(item.address))
	) {
		throw unsafeUrl();
	}

	return url;
};

const bodyRead = async (
	response: Response,
	maxBytes: number,
): Promise<string> => {
	const declared = Number(response.headers.get("content-length") ?? "0");

	if (declared > maxBytes) {
		throw new EUpstream({
			message: DATA_SOURCE_MESSAGE.FETCH_TOO_LARGE,
			cause: declared,
		});
	}

	if (response.body === null) {
		return "";
	}

	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;

	for (;;) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		total += value.byteLength;

		if (total > maxBytes) {
			await reader.cancel();
			throw new EUpstream({
				message: DATA_SOURCE_MESSAGE.FETCH_TOO_LARGE,
				cause: total,
			});
		}

		chunks.push(value);
	}

	return Buffer.concat(chunks).toString("utf8");
};

export type TOutboundTextOptions = {
	maxBytes: number;
	bearerToken?: string | undefined;
};

export const outboundTextFetch = (
	value: string,
	options: TOutboundTextOptions,
): Effect.Effect<string, EBadRequest | EUpstream> =>
	Effect.tryPromise({
		try: async (): Promise<string> => {
			const url = await urlCheck(value);
			const headers: Record<string, string> =
				options.bearerToken === undefined
					? {}
					: { authorization: `Bearer ${options.bearerToken}` };

			const response = await fetch(url, {
				method: "GET",
				redirect: "error",
				headers,
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			}).catch((cause: unknown): never => {
				throw new EUpstream({
					message: DATA_SOURCE_MESSAGE.FETCH_FAILED,
					cause,
				});
			});

			if (!response.ok) {
				throw new EUpstream({
					message: `${DATA_SOURCE_MESSAGE.FETCH_STATUS} (${response.status})`,
					cause: response.status,
				});
			}

			return bodyRead(response, options.maxBytes);
		},
		catch: (cause): EBadRequest | EUpstream => {
			if (cause instanceof EBadRequest || cause instanceof EUpstream) {
				return cause;
			}

			return new EUpstream({
				message: DATA_SOURCE_MESSAGE.FETCH_FAILED,
				cause,
			});
		},
	});
