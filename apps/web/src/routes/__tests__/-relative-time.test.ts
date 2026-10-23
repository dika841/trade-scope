import { DASHBOARD_MESSAGE } from "@app/messages";
import { describe, expect, it } from "vitest";
import { relativeTimeLabel } from "#/routes/_authenticated/dashboard/_utils/relative-time.ts";

const NOW = new Date("2026-09-25T12:00:00.000Z");

const minutesBefore = (minutes: number): string =>
	new Date(NOW.getTime() - minutes * 60_000).toISOString();

describe("relativeTimeLabel", () => {
	it("says just now under a minute", (): void => {
		expect(relativeTimeLabel(minutesBefore(0), NOW)).toBe(
			DASHBOARD_MESSAGE.JUST_NOW,
		);
	});

	it("counts minutes under an hour", (): void => {
		expect(relativeTimeLabel(minutesBefore(5), NOW)).toBe(
			`5${DASHBOARD_MESSAGE.MINUTES_AGO}`,
		);
	});

	it("counts hours under a day", (): void => {
		expect(relativeTimeLabel(minutesBefore(3 * 60), NOW)).toBe(
			`3${DASHBOARD_MESSAGE.HOURS_AGO}`,
		);
	});

	it("counts days after that", (): void => {
		expect(relativeTimeLabel(minutesBefore(2 * 24 * 60), NOW)).toBe(
			`2${DASHBOARD_MESSAGE.DAYS_AGO}`,
		);
	});
});
