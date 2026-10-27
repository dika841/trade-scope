import {
	MAIL_TEMPLATE,
	mailSendSafe,
	pilotMailBuild,
	type TPilotMailKind,
} from "@app/mail";
import { PILOT_STATUS_LABEL } from "@app/messages";
import { Effect } from "effect";
import { env } from "#/platform/config/env.ts";
import { MailService, type TMailServiceId } from "#/platform/mail/mailer.ts";
import { logger } from "#/platform/observability/logger.ts";
import { PilotRepo, type TPilotRepoId } from "#/pilot/domain/pilot.ts";
import type { EDatabase } from "#/shared/errors.ts";

export type TPilotNotifyInput = {
	id: string;
	kind: TPilotMailKind;
};

const urlOf = (id: string): string =>
	`${env.WEB_ORIGIN.replace(/\/$/, "")}/pilots/${id}`;

export const pilotNotify = Effect.fn("pilotNotify")(function* (
	input: TPilotNotifyInput,
	actorId: string,
): Effect.fn.Return<void, EDatabase, TPilotRepoId | TMailServiceId> {
	const repo = yield* PilotRepo;
	const { mailer } = yield* MailService;
	const row = yield* repo.getById(input.id);

	if (
		row === null ||
		row.ownerId === null ||
		row.ownerEmail === null ||
		row.ownerId === actorId
	) {
		return;
	}

	const email = row.ownerEmail;
	const name = row.ownerName ?? row.ownerEmail;
	const title = row.productDescription;
	const status = PILOT_STATUS_LABEL[row.status];
	const url = urlOf(row.id);

	yield* Effect.promise(() =>
		mailSendSafe(
			mailer,
			logger,
			MAIL_TEMPLATE.PILOT,
			pilotMailBuild({
				to: email,
				name,
				title,
				status,
				url,
				kind: input.kind,
			}),
		),
	);
});
