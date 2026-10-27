export const ACTIVITY_RESOURCE_TYPE = {
	USER: "user",
	ROLE: "role",
	SESSION: "session",
	DATA_SOURCE: "data_source",
	PILOT: "pilot",
	REPORT: "report",
	INGESTION: "ingestion",
} as const;

export type TActivityResourceType =
	(typeof ACTIVITY_RESOURCE_TYPE)[keyof typeof ACTIVITY_RESOURCE_TYPE];

export const ACTIVITY_ACTION = {
	USER_CREATE: "user.create",
	USER_UPDATE: "user.update",
	USER_DELETE: "user.delete",
	USER_PASSWORD_RESET: "user.password_reset",
	ROLE_CREATE: "role.create",
	ROLE_UPDATE: "role.update",
	ROLE_DELETE: "role.delete",
	SESSION_CREATE: "session.create",
	DATA_SOURCE_CREATE: "data_source.create",
	DATA_SOURCE_UPDATE: "data_source.update",
	DATA_SOURCE_DELETE: "data_source.delete",
	PILOT_CREATE: "pilot.create",
	PILOT_UPDATE: "pilot.update",
	REPORT_CREATE: "report.create",
	REPORT_REVOKE: "report.revoke",
	REPORT_DELETE: "report.delete",
	INGESTION_RUN: "ingestion.run",
	INGESTION_FINISH: "ingestion.finish",
} as const;

export type TActivityAction =
	(typeof ACTIVITY_ACTION)[keyof typeof ACTIVITY_ACTION];
