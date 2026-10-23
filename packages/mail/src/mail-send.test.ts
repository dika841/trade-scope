import { MAIL_MESSAGE } from "@app/messages";
import { describe, expect, it, vi } from "vitest";
import { MAIL_EVENT, MAIL_TEMPLATE, mailSendSafe } from "./mail-send.ts";
import type { TMailMessage } from "./mailer.ts";

const MESSAGE: TMailMessage = {
	to: "analyst@test.app",
	subject: "Reset your password",
	text: "text",
	html: "<p>html</p>",
};

describe("mailSendSafe", () => {
	it("reports success when the mail goes out", async (): Promise<void> => {
		const send = vi.fn().mockResolvedValue(undefined);
		const error = vi.fn();

		const sent = await mailSendSafe(
			{ send },
			{ error },
			MAIL_TEMPLATE.PASSWORD_RESET,
			MESSAGE,
		);

		expect(sent).toBe(true);
		expect(error).not.toHaveBeenCalled();
	});

	it("reports failure instead of throwing, so a mail outage cannot fail the request", async (): Promise<void> => {
		const send = vi.fn().mockRejectedValue(new Error("EAUTH invalid login"));
		const error = vi.fn();

		const sent = await mailSendSafe(
			{ send },
			{ error },
			MAIL_TEMPLATE.PASSWORD_RESET,
			MESSAGE,
		);

		expect(sent).toBe(false);
	});

	it("logs the event and template an alert matches on, and not the recipient", async (): Promise<void> => {
		const send = vi.fn().mockRejectedValue(new Error("EAUTH invalid login"));
		const error = vi.fn();

		await mailSendSafe(
			{ send },
			{ error },
			MAIL_TEMPLATE.PASSWORD_RESET,
			MESSAGE,
		);

		expect(error).toHaveBeenCalledTimes(1);
		const [data, message] = error.mock.calls[0] ?? [];
		expect(data).toMatchObject({
			event: MAIL_EVENT.SEND_FAILED,
			template: MAIL_TEMPLATE.PASSWORD_RESET,
		});
		expect(message).toBe(MAIL_MESSAGE.SEND_FAILED);
		expect(JSON.stringify(data)).not.toContain(MESSAGE.to);
	});
});
