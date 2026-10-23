import { connect, type ChannelModel, type ConfirmChannel } from "amqplib";
import { Context, Effect, Layer } from "effect";
import { match } from "ts-pattern";
import { EQueue } from "#/shared/errors.ts";
import { env } from "#/platform/config/env.ts";
import { closeQuietly } from "#/platform/resource-close.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { SERVICE_TAG } from "#/platform/service-tags.ts";

export const QUEUE_CONNECT_ATTEMPTS = 30;
export const QUEUE_CONNECT_DELAY_MS = 2_000;

const NO_ATTEMPTS_LEFT = 0;
const ONE_ATTEMPT = 1;

export type TQueueConnection = {
	model: ChannelModel;
	channel: ConfirmChannel;
};

export const queueConnectionCreate = async (
	rabbitmqUrl: string,
): Promise<TQueueConnection> => {
	const model = await connect(rabbitmqUrl);
	const channel = await model.createConfirmChannel();
	return { model, channel };
};

export type TQueueService = {
	readonly connection: () => Effect.Effect<TQueueConnection, EQueue>;
	readonly channel: () => Effect.Effect<ConfirmChannel, EQueue>;
	readonly close: () => Promise<void>;
};

export const QUEUE_LOST_REASON = {
	CLOSED: "closed",
	ERRORED: "errored",
} as const;

export type TQueueLostReason =
	(typeof QUEUE_LOST_REASON)[keyof typeof QUEUE_LOST_REASON];

export type TQueueLostHandler = (
	reason: TQueueLostReason,
	cause: unknown,
) => void;

export type TQueueServiceId = TServiceId<typeof SERVICE_TAG.QUEUE>;

export const QueueService = Context.Service<TQueueServiceId, TQueueService>(
	SERVICE_TAG.QUEUE,
);

type TQueueState = {
	current: TQueueConnection | null;
	opening: Promise<TQueueConnection> | null;
};

export type TQueueOpen = (rabbitmqUrl: string) => Promise<TQueueConnection>;

export const queueServiceCreate = (
	rabbitmqUrl: string,
	openConnection: TQueueOpen = queueConnectionCreate,
): TQueueService => {
	const state: TQueueState = { current: null, opening: null };

	const forget = (): void => {
		state.current = null;
		state.opening = null;
	};

	const open = async (): Promise<TQueueConnection> => {
		const created = await openConnection(rabbitmqUrl);
		created.model.on("error", forget);
		created.model.on("close", forget);
		state.current = created;
		state.opening = null;
		return created;
	};

	const opened = (): Promise<TQueueConnection> =>
		match(state.opening)
			.with(null, (): Promise<TQueueConnection> => {
				const started = open();
				state.opening = started;
				return started;
			})
			.otherwise((pending): Promise<TQueueConnection> => pending);

	const connection = (): Effect.Effect<TQueueConnection, EQueue> =>
		Effect.tryPromise({
			try: async (): Promise<TQueueConnection> =>
				match(state.current)
					.with(null, (): Promise<TQueueConnection> => opened())
					.otherwise(async (found): Promise<TQueueConnection> => found),
			catch: (cause): EQueue => {
				forget();
				return new EQueue({ cause });
			},
		});

	const channel = (): Effect.Effect<ConfirmChannel, EQueue> =>
		connection().pipe(Effect.map((found): ConfirmChannel => found.channel));

	const close = async (): Promise<void> => {
		const current = state.current;
		forget();

		await match(current)
			.with(null, (): Promise<void> => Promise.resolve())
			.otherwise((found): Promise<void> => found.model.close());
	};

	return { connection, channel, close };
};

export const queueConnectionWatch = (
	model: ChannelModel,
	onLost: TQueueLostHandler,
): void => {
	let notified = false;

	const notify = (reason: TQueueLostReason, cause: unknown): void => {
		match(notified)
			.with(true, (): void => undefined)
			.otherwise((): void => {
				notified = true;
				onLost(reason, cause);
			});
	};

	model.on("close", (cause: unknown): void => {
		notify(QUEUE_LOST_REASON.CLOSED, cause);
	});

	model.on("error", (cause: unknown): void => {
		notify(QUEUE_LOST_REASON.ERRORED, cause);
	});
};

export const queueServiceLayer = Layer.effect(
	QueueService,
	Effect.gen(function* () {
		const service = yield* Effect.acquireRelease(
			Effect.sync(() => queueServiceCreate(env.RABBITMQ_URL)),
			(found): Effect.Effect<void> => closeQuietly(() => found.close()),
		);

		return QueueService.of(service);
	}),
);

export const queueConnectionAwait = (
	service: TQueueService,
	attempts: number = QUEUE_CONNECT_ATTEMPTS,
	delayMs: number = QUEUE_CONNECT_DELAY_MS,
): Effect.Effect<TQueueConnection, EQueue> =>
	service.connection().pipe(
		Effect.catch(
			(error: EQueue): Effect.Effect<TQueueConnection, EQueue> =>
				match(attempts > NO_ATTEMPTS_LEFT)
					.with(
						false,
						(): Effect.Effect<TQueueConnection, EQueue> => Effect.fail(error),
					)
					.otherwise(
						(): Effect.Effect<TQueueConnection, EQueue> =>
							Effect.sleep(delayMs).pipe(
								Effect.flatMap(() =>
									queueConnectionAwait(
										service,
										attempts - ONE_ATTEMPT,
										delayMs,
									),
								),
							),
					),
		),
	);

export const queueChannelAwait = (
	service: TQueueService,
	attempts: number = QUEUE_CONNECT_ATTEMPTS,
	delayMs: number = QUEUE_CONNECT_DELAY_MS,
): Effect.Effect<ConfirmChannel, EQueue> =>
	queueConnectionAwait(service, attempts, delayMs).pipe(
		Effect.map((found): ConfirmChannel => found.channel),
	);
