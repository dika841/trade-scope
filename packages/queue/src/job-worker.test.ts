import type { Channel, ConsumeMessage, Options } from "amqplib";
import { match, P } from "ts-pattern";
import { describe, expect, it, vi } from "vitest";
import { jobDedupeFake } from "./job-dedupe-fake.ts";
import { deadLetterQueueNameOf, retryQueueNameOf } from "./job-names.ts";
import { ATTEMPT_HEADER, jobWorkerCreate } from "./job-worker.ts";

const QUEUE = "example";
const MESSAGE_ID = "b7d1";
const PAYLOAD = { itemId: "item-1" };

const RETRY_POLICY = {
	maxAttempts: 3,
	backoffBaseMs: 1_000,
	backoffFactor: 2,
};

type TSent = {
	queue: string;
	content: Buffer;
	options: Options.Publish;
};

type TChannelFake = {
	channel: Channel;
	sent: TSent[];
	asserted: string[];
	acked: ConsumeMessage[];
	deliver: (message: ConsumeMessage) => Promise<void>;
	failAck: (reason: string) => void;
};

const flush = async (): Promise<void> => {
	for (const _ of [0, 1, 2, 3]) {
		await new Promise<void>((resolve): void => {
			setImmediate(resolve);
		});
	}
};

const channelFake = (): TChannelFake => {
	const sent: TSent[] = [];
	const asserted: string[] = [];
	const acked: ConsumeMessage[] = [];
	let consumer: ((message: ConsumeMessage | null) => void) | null = null;
	let ackFailure: string | null = null;

	const failAck = (reason: string): void => {
		ackFailure = reason;
	};

	const channel = {
		assertQueue: async (queue: string): Promise<unknown> => {
			asserted.push(queue);
			return undefined;
		},
		prefetch: async (): Promise<unknown> => undefined,
		consume: async (
			_queue: string,
			handler: (message: ConsumeMessage | null) => void,
		): Promise<unknown> => {
			consumer = handler;
			return undefined;
		},
		sendToQueue: (
			queue: string,
			content: Buffer,
			options: Options.Publish,
		): boolean => {
			sent.push({ queue, content, options });
			return true;
		},
		ack: (message: ConsumeMessage): void => {
			match(ackFailure)
				.with(P.nullish, (): void => {
					acked.push(message);
				})
				.otherwise((reason): void => {
					throw new Error(reason);
				});
		},
		nack: (): void => undefined,
	} as unknown as Channel;

	const deliver = async (message: ConsumeMessage): Promise<void> => {
		consumer?.(message);
		await flush();
	};

	return { channel, sent, asserted, acked, deliver, failAck };
};

const malformedMessage = (): ConsumeMessage =>
	({
		content: Buffer.from("{ this is not json"),
		fields: { routingKey: QUEUE },
		properties: { messageId: MESSAGE_ID, headers: {} },
	}) as unknown as ConsumeMessage;

const messageOf = (attempt?: number): ConsumeMessage =>
	({
		content: Buffer.from(JSON.stringify(PAYLOAD)),
		fields: { routingKey: QUEUE },
		properties: {
			messageId: MESSAGE_ID,
			headers: attempt === undefined ? {} : { [ATTEMPT_HEADER]: attempt },
		},
	}) as unknown as ConsumeMessage;

describe("jobWorkerCreate", () => {
	it("declares the retry and dead letter queues alongside the main one", async () => {
		const fake = channelFake();

		await jobWorkerCreate({
			name: QUEUE,
			channel: fake.channel,
			handler: async (): Promise<void> => undefined,
			dedupe: jobDedupeFake(),
		});

		expect(fake.asserted).toContain(QUEUE);
		expect(fake.asserted).toContain(retryQueueNameOf(QUEUE));
		expect(fake.asserted).toContain(deadLetterQueueNameOf(QUEUE));
	});

	it("acks a successful job without republishing it", async () => {
		const fake = channelFake();
		const handler = vi.fn(async (): Promise<void> => undefined);

		await jobWorkerCreate({
			name: QUEUE,
			channel: fake.channel,
			handler,
			dedupe: jobDedupeFake(),
		});
		await fake.deliver(messageOf());

		expect(handler).toHaveBeenCalledTimes(1);
		expect(fake.acked).toHaveLength(1);
		expect(fake.sent).toHaveLength(0);
	});

	it("routes a failed job to the retry queue with a backoff and a raised attempt", async () => {
		const fake = channelFake();
		const dedupe = jobDedupeFake();

		await jobWorkerCreate({
			name: QUEUE,
			channel: fake.channel,
			handler: async (): Promise<void> => {
				throw new Error("boom");
			},
			dedupe,
			retry: RETRY_POLICY,
		});
		await fake.deliver(messageOf());

		expect(fake.sent).toHaveLength(1);
		expect(fake.sent[0]?.queue).toBe(retryQueueNameOf(QUEUE));
		expect(fake.sent[0]?.options.expiration).toBe("1000");
		expect(fake.sent[0]?.options.headers).toMatchObject({
			[ATTEMPT_HEADER]: 2,
		});
		expect(fake.acked).toHaveLength(1);
		expect(dedupe.claimed.has(MESSAGE_ID)).toBe(false);
	});

	it("routes a job to the dead letter queue once the attempts are exhausted", async () => {
		const fake = channelFake();

		await jobWorkerCreate({
			name: QUEUE,
			channel: fake.channel,
			handler: async (): Promise<void> => {
				throw new Error("boom");
			},
			dedupe: jobDedupeFake(),
			retry: RETRY_POLICY,
		});
		await fake.deliver(messageOf(RETRY_POLICY.maxAttempts));

		expect(fake.sent).toHaveLength(1);
		expect(fake.sent[0]?.queue).toBe(deadLetterQueueNameOf(QUEUE));
		expect(fake.acked).toHaveLength(1);
	});

	it("dead letters a malformed payload instead of leaving it unacked", async () => {
		const fake = channelFake();
		const handler = vi.fn(async (): Promise<void> => undefined);
		const onError = vi.fn();

		await jobWorkerCreate({
			name: QUEUE,
			channel: fake.channel,
			handler,
			dedupe: jobDedupeFake(),
			retry: RETRY_POLICY,
			onError,
		});
		await fake.deliver(malformedMessage());

		expect(handler).not.toHaveBeenCalled();
		expect(fake.sent).toHaveLength(1);
		expect(fake.sent[0]?.queue).toBe(deadLetterQueueNameOf(QUEUE));
		expect(fake.acked).toHaveLength(1);
		expect(onError).not.toHaveBeenCalled();
	});

	it("retries rather than dead letters when the dedupe claim itself fails", async () => {
		const fake = channelFake();
		const onError = vi.fn();
		const dedupe = {
			claim: async (): Promise<boolean> => {
				throw new Error("cache unreachable");
			},
			release: async (): Promise<void> => undefined,
		};

		await jobWorkerCreate({
			name: QUEUE,
			channel: fake.channel,
			handler: async (): Promise<void> => undefined,
			dedupe,
			retry: RETRY_POLICY,
			onError,
		});
		await fake.deliver(messageOf());

		expect(fake.sent).toHaveLength(1);
		expect(fake.sent[0]?.queue).toBe(retryQueueNameOf(QUEUE));
		expect(fake.acked).toHaveLength(1);
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it("still retries and acks when releasing the claim fails", async () => {
		const fake = channelFake();
		const dedupe = {
			claim: async (): Promise<boolean> => true,
			release: async (): Promise<void> => {
				throw new Error("cache unreachable");
			},
		};

		await jobWorkerCreate({
			name: QUEUE,
			channel: fake.channel,
			handler: async (): Promise<void> => {
				throw new Error("boom");
			},
			dedupe,
			retry: RETRY_POLICY,
		});
		await fake.deliver(messageOf());

		expect(fake.sent).toHaveLength(1);
		expect(fake.sent[0]?.queue).toBe(retryQueueNameOf(QUEUE));
		expect(fake.acked).toHaveLength(1);
	});

	it("reports rather than rejects when the channel itself fails", async () => {
		const fake = channelFake();
		const onError = vi.fn();

		fake.failAck("channel closed");

		await jobWorkerCreate({
			name: QUEUE,
			channel: fake.channel,
			handler: async (): Promise<void> => undefined,
			dedupe: jobDedupeFake(),
			onError,
		});
		await fake.deliver(messageOf());

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
	});

	it("processes a repeated message id only once", async () => {
		const fake = channelFake();
		const handler = vi.fn(async (): Promise<void> => undefined);
		const dedupe = jobDedupeFake();

		await jobWorkerCreate({
			name: QUEUE,
			channel: fake.channel,
			handler,
			dedupe,
		});
		await fake.deliver(messageOf());
		await fake.deliver(messageOf());

		expect(handler).toHaveBeenCalledTimes(1);
		expect(fake.acked).toHaveLength(2);
		expect(fake.sent).toHaveLength(0);
	});
});
