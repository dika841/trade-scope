import { MAIL_MESSAGE } from "@app/messages";
import { describe, expect, it } from "vitest";
import { passwordResetMailBuild } from "./password-reset-mail.ts";

const INPUT = {
	to: "analyst@test.app",
	name: "Analyst",
	url: "https://trade-scope.test/reset-password?token=abc123",
};

describe("passwordResetMailBuild", () => {
	it("addresses the recipient and uses the shared subject", () => {
		const message = passwordResetMailBuild(INPUT);

		expect(message.to).toBe(INPUT.to);
		expect(message.subject).toBe(MAIL_MESSAGE.PASSWORD_RESET_SUBJECT);
	});

	it("carries the reset url in the plain text body", () => {
		expect(passwordResetMailBuild(INPUT).text).toContain(INPUT.url);
	});

	it("links the reset url from the html body", () => {
		expect(passwordResetMailBuild(INPUT).html).toContain(
			`<a href="${INPUT.url}">${MAIL_MESSAGE.PASSWORD_RESET_ACTION}</a>`,
		);
	});

	it("greets the recipient by name", () => {
		expect(passwordResetMailBuild(INPUT).text).toContain(
			`${MAIL_MESSAGE.GREETING} ${INPUT.name},`,
		);
	});
});
