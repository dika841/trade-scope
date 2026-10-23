import { PERMISSION_LABEL, ROLE_LABEL } from "@app/messages";
import type { TPermission, TRole } from "@app/permissions";

export const ROLE_KEY = {
	SUPERADMIN: "superadmin",
	ADMIN: "admin",
	ANALYST: "analyst",
	VIEWER: "viewer",
} as const satisfies Record<string, TRole>;

export { ROLE_LABEL, PERMISSION_LABEL };

export const FIXED_ROLE_KEYS: readonly TRole[] = [
	ROLE_KEY.SUPERADMIN,
	ROLE_KEY.ADMIN,
	ROLE_KEY.ANALYST,
	ROLE_KEY.VIEWER,
];

export const PERMISSION_KEY = {
	USER_MANAGE: "user:manage",
	ACTIVITY_READ: "activity:read",
	CATALOG_MANAGE: "catalog:manage",
	INGESTION_RUN: "ingestion:run",
	PILOT_MANAGE: "pilot:manage",
	REPORT_MANAGE: "report:manage",
} as const satisfies Record<string, TPermission>;
