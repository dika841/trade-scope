import {
	deadLetterQueueNameOf,
	jobPublisherCreate,
	jobWorkerCreate,
	retryQueueNameOf,
} from "@app/queue";
import { jobDedupeFake } from "@app/queue/testing";
import { connect, type ChannelModel, type ConfirmChannel } from "amqplib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RABBITMQ_URL } from "../support/services.ts";

const QUEUE = `e2e-recovery-${Date.now()}`;
const PAYLOAD = { itemId: "item-1" };
const RETRY = { maxAttempts: 2, backoffBaseMs: 50, backoffFactor: 1 };
const SETTLE_MS = 2_000;

let model: ChannelModel;
let channel: ConfirmChannel;

const settle = (): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

const purge = async (name: string): Promise<void> => {
	await channel.deleteQueue(name).catch(() => undefined);
};

beforeAll(async (): Promise<void> => {
	model = await connect(RABBITMQ_URL);
	channel = await model.createConfirmChannel();
});

afterAll(async (): Promise<void> => {
	await purge(QUEUE);
	await purge(retryQueueNameOf(QUEUE));
	await purge(deadLetterQueueNameOf(QUEUE));
	await channel.close().catch(() => undefined);
	await model.close().catch(() => undefined);
});

describe("job failure and recovery against a real broker", () => {
	it("retries a failing job and parks it in the dead letter queue once the attempts run out", async (): Promise<void> => {
		const attempts: number[] = [];

		await jobWorkerCreate<typeof PAYLOAD>({
			name: QUEUE,
			channel,
			dedupe: jobDedupeFake(),
			retry: RETRY,
			handler: async (): Promise<void> => {
				attempts.push(Date.now());
				throw new Error("handler always fails");
			},
		});

		const publisher = await jobPublisherCreate<typeof PAYLOAD>(QUEUE, channel);
		await publisher.add(PAYLOAD);
		await settle();

		expect(attempts.length).toBe(RETRY.maxAttempts);

		const dead = await channel.checkQueue(deadLetterQueueNameOf(QUEUE));
		expect(dead.messageCount).toBe(1);

		const main = await channel.checkQueue(QUEUE);
		expect(main.messageCount).toBe(0);
	});

	it("processes a republished payload once, so draining the dead letter queue cannot double up", async (): Promise<void> => {
		const name = `${QUEUE}-dedupe`;
		const handled: number[] = [];
		const dedupe = jobDedupeFake();

		await jobWorkerCreate<typeof PAYLOAD>({
			name,
			channel,
			dedupe,
			handler: async (): Promise<void> => {
				handled.push(Date.now());
			},
		});

		const publisher = await jobPublisherCreate<typeof PAYLOAD>(name, channel);
		await publisher.add(PAYLOAD);
		await publisher.add(PAYLOAD);
		await settle();

		expect(handled.length).toBe(1);

		await purge(name);
		await purge(retryQueueNameOf(name));
		await purge(deadLetterQueueNameOf(name));
	});

	it("resolves a publish only once the broker holds the message", async (): Promise<void> => {
		const name = `${QUEUE}-confirm`;

		const publisher = await jobPublisherCreate<typeof PAYLOAD>(name, channel);
		await publisher.add(PAYLOAD);

		const main = await channel.checkQueue(name);
		expect(main.messageCount).toBe(1);

		await purge(name);
		await purge(retryQueueNameOf(name));
		await purge(deadLetterQueueNameOf(name));
	});
});
