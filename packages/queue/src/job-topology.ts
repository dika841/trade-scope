import type { Channel } from "amqplib";
import { deadLetterQueueNameOf, retryQueueNameOf } from "./job-names.ts";

export const DEFAULT_EXCHANGE = "";

export const jobTopologyAssert = async (
	name: string,
	channel: Channel,
): Promise<void> => {
	await channel.assertQueue(deadLetterQueueNameOf(name), { durable: true });
	await channel.assertQueue(retryQueueNameOf(name), {
		durable: true,
		deadLetterExchange: DEFAULT_EXCHANGE,
		deadLetterRoutingKey: name,
	});
	await channel.assertQueue(name, { durable: true });
};
