import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";
import { EQueue } from "#/shared/errors.ts";
import {
	QUEUE_LOST_REASON,
	queueChannelAwait,
	queueConnectionWatch,
	queueServiceCreate,
	type TQueueConnection,
} from "#/platform/queue/rabbitmq.ts";

const URL = "amqp://127.0.0.1:5672";
const NO_DELAY = 0;

type THandlers = Record<string, () => void>;

const connectionFake = (): TQueueConnection & { handlers: THandlers } => {
	const handlers: THandlers = {};

	return {
		handlers,
		model: {
			on: (event: string, handler: () => void): void => {
				handlers[event] = handler;
			},
		},
		channel: { marker: "channel" },
	} as unknown as TQueueConnection & { handlers: THandlers };
};

describe("queueServiceCreate", () => {
	it("does not touch the broker until a channel is asked for", (): void => {
		const open = vi.fn();

		queueServiceCreate(URL, open);

		expect(open).not.toHaveBeenCalled();
	});

	it("opens once and reuses the connection", async (): Promise<void> => {
		const open = vi.fn().mockResolvedValue(connectionFake());
		const service = queueServiceCreate(URL, open);

		await Effect.runPromise(service.channel());
		await Effect.runPromise(service.channel());

		expect(open).toHaveBeenCalledTimes(1);
	});

	it("opens once when two callers race for the first channel", async (): Promise<void> => {
		const open = vi.fn().mockResolvedValue(connectionFake());
		const service = queueServiceCreate(URL, open);

		await Promise.all([
			Effect.runPromise(service.channel()),
			Effect.runPromise(service.channel()),
		]);

		expect(open).toHaveBeenCalledTimes(1);
	});

	it("fails with EQueue rather than throwing when the broker is down", async (): Promise<void> => {
		const open = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
		const service = queueServiceCreate(URL, open);

		const error = await Effect.runPromise(
			service.channel().pipe(Effect.catch((found) => Effect.succeed(found))),
		);

		expect(error).toBeInstanceOf(EQueue);
	});

	it("reconnects on the next call after the connection closes", async (): Promise<void> => {
		const connection = connectionFake();
		const open = vi.fn().mockResolvedValue(connection);
		const service = queueServiceCreate(URL, open);

		await Effect.runPromise(service.channel());
		connection.handlers.close?.();
		await Effect.runPromise(service.channel());

		expect(open).toHaveBeenCalledTimes(2);
	});
});

describe("queueChannelAwait", () => {
	it("keeps waiting while the broker is unreachable, then succeeds", async (): Promise<void> => {
		const open = vi
			.fn()
			.mockRejectedValueOnce(new Error("ECONNREFUSED"))
			.mockRejectedValueOnce(new Error("ECONNREFUSED"))
			.mockResolvedValue(connectionFake());
		const service = queueServiceCreate(URL, open);

		const channel = await Effect.runPromise(
			queueChannelAwait(service, 5, NO_DELAY),
		);

		expect(channel).toMatchObject({ marker: "channel" });
		expect(open).toHaveBeenCalledTimes(3);
	});

	it("gives up once the attempts run out", async (): Promise<void> => {
		const open = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
		const service = queueServiceCreate(URL, open);

		const error = await Effect.runPromise(
			queueChannelAwait(service, 2, NO_DELAY).pipe(
				Effect.catch((found) => Effect.succeed(found)),
			),
		);

		expect(error).toBeInstanceOf(EQueue);
		expect(open).toHaveBeenCalledTimes(3);
	});
});

describe("queueConnectionWatch", () => {
	it("reports a closed connection once", (): void => {
		const fake = connectionFake();
		const onLost = vi.fn();

		queueConnectionWatch(fake.model, onLost);
		fake.handlers.close?.();

		expect(onLost).toHaveBeenCalledTimes(1);
		expect(onLost.mock.calls[0]?.[0]).toBe(QUEUE_LOST_REASON.CLOSED);
	});

	it("reports an errored connection", (): void => {
		const fake = connectionFake();
		const onLost = vi.fn();

		queueConnectionWatch(fake.model, onLost);
		fake.handlers.error?.();

		expect(onLost).toHaveBeenCalledTimes(1);
		expect(onLost.mock.calls[0]?.[0]).toBe(QUEUE_LOST_REASON.ERRORED);
	});

	it("reports only once when an error is followed by a close", (): void => {
		const fake = connectionFake();
		const onLost = vi.fn();

		queueConnectionWatch(fake.model, onLost);
		fake.handlers.error?.();
		fake.handlers.close?.();

		expect(onLost).toHaveBeenCalledTimes(1);
	});
});
