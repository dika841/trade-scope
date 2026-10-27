import {
	ACTIVITY_ACTION,
	ACTIVITY_RESOURCE_TYPE,
	type TActivityAction,
	type TActivityResourceType,
} from "@app/activity";

export const ACTIVITY_MESSAGE = {
	TITLE: "Activity",
	EMPTY: "No activity yet.",
	PAGINATION_NOUN: "entries",
	FILTER_ACTION: "Action",
	FILTER_ACTION_ALL: "All actions",
	FILTER_ENTITY: "Entity",
	FILTER_ENTITY_ALL: "All entities",
	COLUMN_WHEN: "When",
	COLUMN_ACTOR: "Actor",
	COLUMN_ACTION: "Action",
	COLUMN_ENTITY: "Entity",
	COLUMN_DETAILS: "Details",
} as const;

export const ACTIVITY_ACTION_LABEL = {
	[ACTIVITY_ACTION.USER_CREATE]: "User created",
	[ACTIVITY_ACTION.USER_UPDATE]: "User updated",
	[ACTIVITY_ACTION.USER_DELETE]: "User deleted",
	[ACTIVITY_ACTION.USER_PASSWORD_RESET]: "Password reset",
	[ACTIVITY_ACTION.ROLE_CREATE]: "Role created",
	[ACTIVITY_ACTION.ROLE_UPDATE]: "Role updated",
	[ACTIVITY_ACTION.ROLE_DELETE]: "Role deleted",
	[ACTIVITY_ACTION.SESSION_CREATE]: "Signed in",
	[ACTIVITY_ACTION.DATA_SOURCE_CREATE]: "Data source added",
	[ACTIVITY_ACTION.DATA_SOURCE_UPDATE]: "Data source updated",
	[ACTIVITY_ACTION.DATA_SOURCE_DELETE]: "Data source deleted",
	[ACTIVITY_ACTION.PILOT_CREATE]: "Pilot created",
	[ACTIVITY_ACTION.PILOT_UPDATE]: "Pilot updated",
	[ACTIVITY_ACTION.REPORT_CREATE]: "Report generated",
	[ACTIVITY_ACTION.REPORT_REVOKE]: "Report link revoked",
	[ACTIVITY_ACTION.REPORT_DELETE]: "Report deleted",
	[ACTIVITY_ACTION.INGESTION_RUN]: "Ingestion queued",
	[ACTIVITY_ACTION.INGESTION_FINISH]: "Ingestion finished",
} as const satisfies Record<TActivityAction, string>;

export const ACTIVITY_ENTITY_LABEL = {
	[ACTIVITY_RESOURCE_TYPE.USER]: "User",
	[ACTIVITY_RESOURCE_TYPE.ROLE]: "Role",
	[ACTIVITY_RESOURCE_TYPE.SESSION]: "Session",
	[ACTIVITY_RESOURCE_TYPE.DATA_SOURCE]: "Data source",
	[ACTIVITY_RESOURCE_TYPE.PILOT]: "Pilot",
	[ACTIVITY_RESOURCE_TYPE.REPORT]: "Report",
	[ACTIVITY_RESOURCE_TYPE.INGESTION]: "Ingestion",
} as const satisfies Record<TActivityResourceType, string>;
