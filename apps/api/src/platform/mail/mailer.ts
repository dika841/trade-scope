import { mailerCreate, type TMailer } from "@app/mail";
import { Context, Effect, Layer } from "effect";
import { env } from "#/platform/config/env.ts";
import { closeQuietly } from "#/platform/resource-close.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { SERVICE_TAG } from "#/platform/service-tags.ts";

export type TMailService = { readonly mailer: TMailer };

export type TMailServiceId = TServiceId<typeof SERVICE_TAG.MAIL>;

export const MailService = Context.Service<TMailServiceId, TMailService>(
	SERVICE_TAG.MAIL,
);

export const mailServiceLayer = Layer.effect(
	MailService,
	Effect.gen(function* () {
		const mailer = yield* Effect.acquireRelease(
			Effect.sync(() =>
				mailerCreate({ smtpUrl: env.SMTP_URL, from: env.MAIL_FROM }),
			),
			(found): Effect.Effect<void> =>
				closeQuietly(async (): Promise<void> => found.close()),
		);

		return MailService.of({ mailer });
	}),
);
