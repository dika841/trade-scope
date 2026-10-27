import { MAIL_MESSAGE } from "@app/messages";
import { mailHtmlBuild, mailLinkBuild, mailTextBuild } from "./mail-body.ts";
import type { TMailMessage } from "./mailer.ts";

export const PILOT_MAIL_KIND = {
	ASSIGNED: "assigned",
	UPDATED: "updated",
} as const;

export type TPilotMailKind =
	(typeof PILOT_MAIL_KIND)[keyof typeof PILOT_MAIL_KIND];

export type TPilotMailInput = {
	to: string;
	name: string;
	title: string;
	status: string;
	url: string;
	kind: TPilotMailKind;
};

export const pilotMailBuild = (input: TPilotMailInput): TMailMessage => {
	const subject =
		input.kind === PILOT_MAIL_KIND.ASSIGNED
			? MAIL_MESSAGE.PILOT_ASSIGNED_SUBJECT
			: MAIL_MESSAGE.PILOT_UPDATED_SUBJECT;
	const body =
		input.kind === PILOT_MAIL_KIND.ASSIGNED
			? MAIL_MESSAGE.PILOT_ASSIGNED_BODY
			: MAIL_MESSAGE.PILOT_UPDATED_BODY;
	const status = `${MAIL_MESSAGE.PILOT_STATUS_LINE} ${input.status}`;

	return {
		to: input.to,
		subject: `${subject} ${input.title}`,
		text: mailTextBuild([
			`${MAIL_MESSAGE.GREETING} ${input.name},`,
			body,
			status,
			input.url,
			MAIL_MESSAGE.SIGNATURE,
		]),
		html: mailHtmlBuild([
			`${MAIL_MESSAGE.GREETING} ${input.name},`,
			body,
			status,
			mailLinkBuild(MAIL_MESSAGE.PILOT_ACTION, input.url),
			MAIL_MESSAGE.SIGNATURE,
		]),
	};
};
