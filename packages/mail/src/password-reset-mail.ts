import { MAIL_MESSAGE } from "@app/messages";
import { mailHtmlBuild, mailLinkBuild, mailTextBuild } from "./mail-body.ts";
import type { TMailMessage } from "./mailer.ts";

export type TPasswordResetMailInput = {
	to: string;
	name: string;
	url: string;
};

export const passwordResetMailBuild = (
	input: TPasswordResetMailInput,
): TMailMessage => ({
	to: input.to,
	subject: MAIL_MESSAGE.PASSWORD_RESET_SUBJECT,
	text: mailTextBuild([
		`${MAIL_MESSAGE.GREETING} ${input.name},`,
		MAIL_MESSAGE.PASSWORD_RESET_BODY,
		input.url,
		MAIL_MESSAGE.PASSWORD_RESET_EXPIRY,
		MAIL_MESSAGE.SIGNATURE,
	]),
	html: mailHtmlBuild([
		`${MAIL_MESSAGE.GREETING} ${input.name},`,
		MAIL_MESSAGE.PASSWORD_RESET_BODY,
		mailLinkBuild(MAIL_MESSAGE.PASSWORD_RESET_ACTION, input.url),
		MAIL_MESSAGE.PASSWORD_RESET_EXPIRY,
		MAIL_MESSAGE.SIGNATURE,
	]),
});
