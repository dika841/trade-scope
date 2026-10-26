import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";
import { env } from "#/platform/config/env.ts";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const HINT_CHARS = 4;
const KEY_ENCODING = "hex";
const PAYLOAD_ENCODING = "base64";

const keyOf = (): Buffer =>
	createHash("sha256")
		.update(env.DATA_SOURCE_SECRET_KEY ?? env.BETTER_AUTH_SECRET)
		.digest();

type TSealedParts = {
	iv: Buffer;
	tag: Buffer;
	ciphertext: Buffer;
};

const partsOf = (sealed: string): TSealedParts => {
	const decoded = Buffer.from(sealed, PAYLOAD_ENCODING);
	const iv = decoded.subarray(0, IV_BYTES);
	const tag = decoded.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
	const ciphertext = decoded.subarray(IV_BYTES + TAG_BYTES);

	return { iv, tag, ciphertext };
};

export const secretSeal = (plain: string): string => {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(ALGORITHM, keyOf(), iv);
	const ciphertext = Buffer.concat([
		cipher.update(plain, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();

	return Buffer.concat([iv, tag, ciphertext]).toString(PAYLOAD_ENCODING);
};

export const secretOpen = (sealed: string): string => {
	const { iv, tag, ciphertext } = partsOf(sealed);
	const decipher = createDecipheriv(ALGORITHM, keyOf(), iv);
	decipher.setAuthTag(tag);

	return Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	]).toString("utf8");
};

export const secretHint = (plain: string): string => plain.slice(-HINT_CHARS);

export const secretKeyFingerprint = (): string =>
	createHash("sha256").update(keyOf()).digest(KEY_ENCODING).slice(0, 12);
