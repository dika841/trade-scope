export const PERMISSION = {
	USER_MANAGE: "user:manage",
	ACTIVITY_READ: "activity:read",
	CATALOG_READ: "catalog:read",
	CATALOG_MANAGE: "catalog:manage",
	INGESTION_READ: "ingestion:read",
	INGESTION_RUN: "ingestion:run",
	DATA_SOURCE_MANAGE: "data-source:manage",
	PILOT_READ: "pilot:read",
	PILOT_MANAGE: "pilot:manage",
	REPORT_READ: "report:read",
	REPORT_MANAGE: "report:manage",
} as const;

export type TPermission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const ALL_PERMISSIONS: readonly TPermission[] =
	Object.values(PERMISSION);

export const isPermission = (value: string): value is TPermission =>
	ALL_PERMISSIONS.some((permission) => permission === value);
