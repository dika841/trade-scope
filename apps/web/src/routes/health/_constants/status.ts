export const HEALTH_VIEW_STATUS = {
	CHECKING: "checking",
	OK: "ok",
	DEGRADED: "degraded",
} as const;

export type THealthViewStatus =
	(typeof HEALTH_VIEW_STATUS)[keyof typeof HEALTH_VIEW_STATUS];
