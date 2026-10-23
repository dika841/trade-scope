import { Writable } from "node:stream";
import pino from "pino";
import { describe, expect, it } from "vitest";
import {
	REDACT_PLACEHOLDER,
	connectionUrlRedact,
	loggerOptionsFor,
} from "./logger.ts";

const SERVICE = "api";
const PRODUCTION = "production";
const DEVELOPMENT = "development";
const SECRET = "postgres://app:hunter2@10.0.0.4:5432/app";

type TCaptured = { lines: string[]; stream: Writable };

const capture = (): TCaptured => {
	const lines: string[] = [];
	const stream = new Writable({
		write(chunk, _encoding, done): void {
			lines.push(String(chunk));
			done();
		},
	});

	return { lines, stream };
};

const logged = (value: Record<string, unknown>): Record<string, unknown> => {
	const captured = capture();
	const logger = pino(
		{
			...loggerOptionsFor({ service: SERVICE, env: PRODUCTION }),
			transport: undefined,
		},
		captured.stream,
	);

	logger.info(value, "event");

	return JSON.parse(captured.lines[0] ?? "{}") as Record<string, unknown>;
};

describe("loggerOptionsFor", () => {
	it("writes straight to stdout in production so a collector can take it", (): void => {
		expect(
			loggerOptionsFor({ service: SERVICE, env: PRODUCTION }).transport,
		).toBeUndefined();
	});

	it("pretty prints outside production", (): void => {
		expect(
			loggerOptionsFor({ service: SERVICE, env: DEVELOPMENT }).transport,
		).toMatchObject({ target: "pino-pretty" });
	});

	it("uses a configured transport even in development", (): void => {
		const transport = {
			target: "pino-loki",
			options: { host: "http://loki:3100" },
		};

		expect(
			loggerOptionsFor({ service: SERVICE, env: DEVELOPMENT, transport })
				.transport,
		).toStrictEqual(transport);
	});

	it("defaults to info in production and debug elsewhere", (): void => {
		expect(loggerOptionsFor({ service: SERVICE, env: PRODUCTION }).level).toBe(
			"info",
		);
		expect(loggerOptionsFor({ service: SERVICE, env: DEVELOPMENT }).level).toBe(
			"debug",
		);
	});
});

describe("redaction", () => {
	it("keeps an authorization header out of the log", (): void => {
		const line = logged({ headers: { authorization: "Bearer abc123" } });

		expect(JSON.stringify(line)).not.toContain("abc123");
		expect(line).toMatchObject({
			headers: { authorization: REDACT_PLACEHOLDER },
		});
	});

	it("keeps a password and a token out of the log", (): void => {
		const line = logged({ password: "hunter2", user: { token: "t-1" } });

		const serialized = JSON.stringify(line);
		expect(serialized).not.toContain("hunter2");
		expect(serialized).not.toContain("t-1");
	});

	it("keeps a connection string carried on an error cause out of the log", (): void => {
		const line = logged({ err: { cause: { connectionString: SECRET } } });

		expect(JSON.stringify(line)).not.toContain("hunter2");
	});
});

describe("connectionUrlRedact", () => {
	it("hides the credentials in a broker url while keeping the host readable", (): void => {
		const redacted = connectionUrlRedact(
			"amqp://app:s3cret@broker.internal:5672",
		);

		expect(redacted).not.toContain("s3cret");
		expect(redacted).toContain("broker.internal:5672");
	});

	it("hides the password in a postgres url", (): void => {
		const redacted = connectionUrlRedact(
			"postgres://app:hunter2@10.0.0.4:5432/app",
		);

		expect(redacted).not.toContain("hunter2");
		expect(redacted).toContain("10.0.0.4:5432");
	});

	it("leaves a url without credentials alone", (): void => {
		const plain = "redis://localhost:6379";

		expect(connectionUrlRedact(plain)).toBe(plain);
	});

	it("censors anything that is not a url rather than passing it through", (): void => {
		expect(connectionUrlRedact("not a url at all")).toBe(REDACT_PLACEHOLDER);
	});

	it("survives a redacted broker url reaching the log", (): void => {
		const line = logged({
			broker: connectionUrlRedact("amqp://app:s3cret@broker.internal:5672"),
		});

		expect(JSON.stringify(line)).not.toContain("s3cret");
	});
});
