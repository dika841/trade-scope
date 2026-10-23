import type { Channel, ConsumeMessage } from "amqplib";
import { match, P } from "ts-pattern";
import type { TJobDedupe } from "./job-dedupe.ts";
import { deadLetterQueueNameOf, retryQueueNameOf } from "./job-names.ts";
import { jobTopologyAssert } from "./job-topology.ts";

export const ATTEMPT_HEADER = "x-attempt";

const FIRST_ATTEMPT = 1;
const ATTEMPT_STEP = 1;
const PREFETCH_COUNT = 1;

export const JOB_RETRY_DEFAULT = {
	maxAttempts: 5,
	backoffBaseMs: 1_000,
	backoffFactor: 2,
} as const;

export type TJobHandler<TPayload> = (
	payload: TPayload,
	message: ConsumeMessage,
) => Promise<void>;

export type TJobRetryPolicy = {
	maxAttempts: number;
	backoffBaseMs: number;
	backoffFactor: number;
};

export type TJobWorkerOptions<TPayload> = {
	name: string;
	channel: Channel;
	handler: TJobHandler<TPayload>;
	dedupe: TJobDedupe;
	retry?: TJobRetryPolicy;
	onError?: TJobErrorReporter;
};

export type TJobErrorReporter = (
	error: unknown,
	message: ConsumeMessage,
) => void;

type TPayloadDecoded<TPayload> =
	| { ok: true; payload: TPayload }
	| { ok: false };

type TClaimOutcome =
	| { ok: true; claimed: boolean }
	| { ok: false; error: unknown };

const messageIdOf = (message: ConsumeMessage): string | undefined =>
	message.properties.messageId ?? undefined;

export const attemptOf = (message: ConsumeMessage): number =>
	match(Number(message.properties.headers?.[ATTEMPT_HEADER]))
		.with(
			P.when(
				(value: number): boolean =>
					Number.isInteger(value) && value >= FIRST_ATTEMPT,
			),
			(found): number => found,
		)
		.otherwise((): number => FIRST_ATTEMPT);

export const backoffMsFor = (
	attempt: number,
	policy: TJobRetryPolicy,
): number =>
	policy.backoffBaseMs * policy.backoffFactor ** (attempt - ATTEMPT_STEP);

export const jobWorkerCreate = async <TPayload>(
	options: TJobWorkerOptions<TPayload>,
): Promise<void> => {
	const { name, channel, handler, dedupe } = options;
	const policy = options.retry ?? JOB_RETRY_DEFAULT;

	await jobTopologyAssert(name, channel);
	await channel.prefetch(PREFETCH_COUNT);

	const claimFor = async (message: ConsumeMessage): Promise<boolean> =>
		match(messageIdOf(message))
			.with(P.nullish, (): Promise<boolean> => Promise.resolve(true))
			.otherwise((id): Promise<boolean> => dedupe.claim(id));

	const releaseFor = async (message: ConsumeMessage): Promise<void> =>
		match(messageIdOf(message))
			.with(P.nullish, (): Promise<void> => Promise.resolve(undefined))
			.otherwise((id): Promise<void> => dedupe.release(id));

	const publishRetry = (message: ConsumeMessage, attempt: number): void => {
		channel.sendToQueue(retryQueueNameOf(name), message.content, {
			persistent: true,
			messageId: messageIdOf(message),
			expiration: String(backoffMsFor(attempt, policy)),
			headers: { [ATTEMPT_HEADER]: attempt + ATTEMPT_STEP },
		});
	};

	const publishDeadLetter = (message: ConsumeMessage): void => {
		channel.sendToQueue(deadLetterQueueNameOf(name), message.content, {
			persistent: true,
			messageId: messageIdOf(message),
			headers: message.properties.headers,
		});
	};

	const releaseSafe = (message: ConsumeMessage): Promise<void> =>
		releaseFor(message).catch((): void => undefined);

	const onFailure = async (message: ConsumeMessage): Promise<void> => {
		const attempt = attemptOf(message);
		await releaseSafe(message);

		match(attempt >= policy.maxAttempts)
			.with(true, (): void => publishDeadLetter(message))
			.otherwise((): void => publishRetry(message, attempt));

		channel.ack(message);
	};

	const onPoison = async (message: ConsumeMessage): Promise<void> => {
		await releaseSafe(message);
		publishDeadLetter(message);
		channel.ack(message);
	};

	const payloadDecode = (
		message: ConsumeMessage,
	): TPayloadDecoded<TPayload> => {
		try {
			return {
				ok: true,
				payload: JSON.parse(message.content.toString()) as TPayload,
			};
		} catch {
			return { ok: false };
		}
	};

	const runHandler = (
		message: ConsumeMessage,
		payload: TPayload,
	): Promise<void> =>
		handler(payload, message)
			.then((): void => channel.ack(message))
			.catch((): Promise<void> => onFailure(message));

	const claimOutcome = async (
		message: ConsumeMessage,
	): Promise<TClaimOutcome> => {
		try {
			return { ok: true, claimed: await claimFor(message) };
		} catch (error) {
			return { ok: false, error };
		}
	};

	const processMessage = async (message: ConsumeMessage): Promise<void> =>
		match(await claimOutcome(message))
			.with({ ok: false }, ({ error }): Promise<void> => {
				options.onError?.(error, message);
				return onFailure(message);
			})
			.with({ claimed: false }, async (): Promise<void> => {
				channel.ack(message);
			})
			.otherwise(
				(): Promise<void> =>
					match(payloadDecode(message))
						.with({ ok: false }, (): Promise<void> => onPoison(message))
						.otherwise(
							({ payload }): Promise<void> => runHandler(message, payload),
						),
			);

	await channel.consume(name, (message): void => {
		match(message)
			.with(P.nullish, (): void => undefined)
			.otherwise((found): void => {
				void processMessage(found).catch((error): void => {
					options.onError?.(error, found);
				});
			});
	});
};
