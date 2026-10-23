import { createTransport } from "nodemailer";

export const MAIL_CONNECTION_TIMEOUT_MS = 10_000;
export const MAIL_GREETING_TIMEOUT_MS = 10_000;
export const MAIL_SOCKET_TIMEOUT_MS = 20_000;

export type TMailMessage = {
	to: string;
	subject: string;
	text: string;
	html: string;
};

export type TMailer = {
	send: (message: TMailMessage) => Promise<void>;
	close: () => void;
};

export type TMailerOptions = {
	smtpUrl: string;
	from: string;
};

export const mailerCreate = (options: TMailerOptions): TMailer => {
	const transport = createTransport({
		url: options.smtpUrl,
		connectionTimeout: MAIL_CONNECTION_TIMEOUT_MS,
		greetingTimeout: MAIL_GREETING_TIMEOUT_MS,
		socketTimeout: MAIL_SOCKET_TIMEOUT_MS,
	});

	const send = async (message: TMailMessage): Promise<void> => {
		await transport.sendMail({
			from: options.from,
			to: message.to,
			subject: message.subject,
			text: message.text,
			html: message.html,
		});
	};

	const close = (): void => {
		transport.close();
	};

	return { send, close };
};
