import { MAIL_MESSAGE } from "@app/messages";
import type { TMailMessage, TMailer } from "./mailer.ts";

export const MAIL_EVENT = { SEND_FAILED: "mail.send.failed" } as const;

export const MAIL_TEMPLATE = { PASSWORD_RESET: "password-reset" } as const;

export type TMailTemplate = (typeof MAIL_TEMPLATE)[keyof typeof MAIL_TEMPLATE];

export type TMailLogger = {
	error: (data: Record<string, unknown>, message: string) => void;
};

export const mailSendSafe = (
	mailer: Pick<TMailer, "send">,
	logger: TMailLogger,
	template: TMailTemplate,
	message: TMailMessage,
): Promise<boolean> =>
	mailer
		.send(message)
		.then((): boolean => true)
		.catch((cause: unknown): boolean => {
			logger.error(
				{ event: MAIL_EVENT.SEND_FAILED, template, err: cause },
				MAIL_MESSAGE.SEND_FAILED,
			);
			return false;
		});
