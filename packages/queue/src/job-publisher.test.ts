import type { ConfirmChannel, Options } from "amqplib";
import { describe, expect, it } from "vitest";
import { deadLetterQueueNameOf, retryQueueNameOf } from "./job-names.ts";
import { jobPublisherCreate } from "./job-publisher.ts";

const QUEUE = "example";
const PAYLOAD = { itemId: "item-1" };
const OTHER_PAYLOAD = { itemId: "item-2" };
const TOPOLOGY_SIZE = 3;
const CONFIRMED = null;

type TConfirm = (error: unknown) => void;

type TSent = {
	queue: string;
	content: Buffer;
	options: Options.Publish;
	confirm: TConfirm;
};

type TChannelFake = {
	channel: ConfirmChannel;
	sent: TSent[];
	asserted: string[];
	settleLast: (error: unknown) => void;
};

const channelFake = (): TChannelFake => {
	const sent: TSent[] = [];
	const asserted: string[] = [];

	const channel = {
		assertQueue: async (queue: string): Promise<unknown> => {
			asserted.push(queue);
			return undefined;
		},
		sendToQueue: (
			queue: string,
			content: Buffer,
			options: Options.Publish,
			confirm: TConfirm,
		): boolean => {
			sent.push({ queue, content, options, confirm });
			return true;
		},
	} as unknown as ConfirmChannel;

	const settleLast = (error: unknown): void => {
		sent.at(-1)?.confirm(error);
	};

	return { channel, sent, asserted, settleLast };
};

describe("jobPublisherCreate", () => {
	it("declares the queue, its retry queue and its dead letter queue once, when created", async () => {
		const fake = channelFake();

		const publisher = await jobPublisherCreate<typeof PAYLOAD>(
			QUEUE,
			fake.channel,
		);
		const first = publisher.add(PAYLOAD);
		fake.settleLast(CONFIRMED);
		await first;
		const second = publisher.add(PAYLOAD);
		fake.settleLast(CONFIRMED);
		await second;

		expect(fake.asserted).toHaveLength(TOPOLOGY_SIZE);
		expect(fake.asserted).toContain(QUEUE);
		expect(fake.asserted).toContain(retryQueueNameOf(QUEUE));
		expect(fake.asserted).toContain(deadLetterQueueNameOf(QUEUE));
	});

	it("publishes a persistent message and resolves only once the broker confirms it", async () => {
		const fake = channelFake();
		const publisher = await jobPublisherCreate<typeof PAYLOAD>(
			QUEUE,
			fake.channel,
		);

		let settled = false;
		const pending = publisher.add(PAYLOAD).then((): void => {
			settled = true;
		});
		await Promise.resolve();

		expect(settled).toBe(false);
		expect(fake.sent[0]?.queue).toBe(QUEUE);
		expect(fake.sent[0]?.options.persistent).toBe(true);
		expect(JSON.parse(fake.sent[0]?.content.toString() ?? "")).toEqual(PAYLOAD);

		fake.settleLast(CONFIRMED);
		await pending;

		expect(settled).toBe(true);
	});

	it("rejects when the broker refuses the message", async () => {
		const fake = channelFake();
		const publisher = await jobPublisherCreate<typeof PAYLOAD>(
			QUEUE,
			fake.channel,
		);

		const pending = publisher.add(PAYLOAD);
		fake.settleLast(new Error("message nacked"));

		await expect(pending).rejects.toThrow("message nacked");
	});

	it("derives the message id from the payload so a repeat carries the same id", async () => {
		const fake = channelFake();
		const publisher = await jobPublisherCreate<typeof PAYLOAD>(
			QUEUE,
			fake.channel,
		);

		const first = publisher.add(PAYLOAD);
		fake.settleLast(CONFIRMED);
		await first;
		const repeat = publisher.add(PAYLOAD);
		fake.settleLast(CONFIRMED);
		await repeat;
		const other = publisher.add(OTHER_PAYLOAD);
		fake.settleLast(CONFIRMED);
		await other;

		expect(fake.sent[0]?.options.messageId).toBeTypeOf("string");
		expect(fake.sent[1]?.options.messageId).toBe(
			fake.sent[0]?.options.messageId,
		);
		expect(fake.sent[2]?.options.messageId).not.toBe(
			fake.sent[0]?.options.messageId,
		);
	});
});
