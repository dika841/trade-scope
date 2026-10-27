import { MAIL_MESSAGE } from "@app/messages";
import { describe, expect, it } from "vitest";
import { PILOT_MAIL_KIND, pilotMailBuild } from "./pilot-mail.ts";

const URL_VALUE = "https://app.test/pilots/123";

describe("pilotMailBuild", () => {
	it("names the assignment in the subject and links the pilot", (): void => {
		const message = pilotMailBuild({
			to: "owner@test.app",
			name: "Owner",
			title: "Coffee — 2023",
			status: "New",
			url: URL_VALUE,
			kind: PILOT_MAIL_KIND.ASSIGNED,
		});

		expect(message.subject).toBe(
			`${MAIL_MESSAGE.PILOT_ASSIGNED_SUBJECT} Coffee — 2023`,
		);
		expect(message.text).toContain(MAIL_MESSAGE.PILOT_ASSIGNED_BODY);
		expect(message.text).toContain(URL_VALUE);
		expect(message.html).toContain(
			`<a href="${URL_VALUE}">${MAIL_MESSAGE.PILOT_ACTION}</a>`,
		);
	});

	it("uses the update wording for a status change", (): void => {
		const message = pilotMailBuild({
			to: "owner@test.app",
			name: "Owner",
			title: "Coffee — 2023",
			status: "In review",
			url: URL_VALUE,
			kind: PILOT_MAIL_KIND.UPDATED,
		});

		expect(message.subject).toBe(
			`${MAIL_MESSAGE.PILOT_UPDATED_SUBJECT} Coffee — 2023`,
		);
		expect(message.text).toContain(MAIL_MESSAGE.PILOT_UPDATED_BODY);
		expect(message.text).toContain("In review");
	});
});
