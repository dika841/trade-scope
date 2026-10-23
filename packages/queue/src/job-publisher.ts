import { createHash } from "node:crypto";
import type { ConfirmChannel } from "amqplib";
import { match, P } from "ts-pattern";
import { jobTopologyAssert } from "./job-topology.ts";

const idempotencyMessageId = (name: string, payload: unknown): string =>
	createHash("sha256")
		.update(`${name}:${JSON.stringify(payload)}`)
		.digest("hex");

export type TJobQueue<TPayload> = {
	add: (payload: TPayload) => Promise<void>;
};

const publishConfirmed = (
	channel: ConfirmChannel,
	name: string,
	content: Buffer,
	messageId: string,
): Promise<void> =>
	new Promise((resolve, reject): void => {
		channel.sendToQueue(
			name,
			content,
			{ persistent: true, messageId },
			(error: unknown): void => {
				match(error)
					.with(P.nullish, (): void => resolve())
					.otherwise((found): void => reject(found));
			},
		);
	});

export const jobPublisherCreate = async <TPayload>(
	name: string,
	channel: ConfirmChannel,
): Promise<TJobQueue<TPayload>> => {
	await jobTopologyAssert(name, channel);

	return {
		add: (payload: TPayload): Promise<void> =>
			publishConfirmed(
				channel,
				name,
				Buffer.from(JSON.stringify(payload)),
				idempotencyMessageId(name, payload),
			),
	};
};
