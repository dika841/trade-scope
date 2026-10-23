import { DASHBOARD_MESSAGE } from "@app/messages";
import { match } from "ts-pattern";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export const relativeTimeLabel = (date: string, now: Date): string => {
	const elapsedMs = now.getTime() - new Date(date).getTime();
	const minutes = Math.floor(elapsedMs / MS_PER_MINUTE);
	const hours = Math.floor(elapsedMs / MS_PER_HOUR);
	const days = Math.floor(elapsedMs / MS_PER_DAY);

	return match({ minutes, hours })
		.when(
			({ minutes }) => minutes < 1,
			(): string => DASHBOARD_MESSAGE.JUST_NOW,
		)
		.when(
			({ minutes }) => minutes < MINUTES_PER_HOUR,
			(): string => `${String(minutes)}${DASHBOARD_MESSAGE.MINUTES_AGO}`,
		)
		.when(
			({ hours }) => hours < HOURS_PER_DAY,
			(): string => `${String(hours)}${DASHBOARD_MESSAGE.HOURS_AGO}`,
		)
		.otherwise((): string => `${String(days)}${DASHBOARD_MESSAGE.DAYS_AGO}`);
};
