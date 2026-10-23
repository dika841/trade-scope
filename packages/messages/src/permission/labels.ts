import type { TPermission, TRole } from "@app/permissions";

export const PERMISSION_LABEL = {
	"user:manage": "Manage users and roles",
	"activity:read": "View the activity log",
	"catalog:read": "View the HS catalog",
	"catalog:manage": "Manage the HS catalog",
	"ingestion:read": "View ingestion runs",
	"ingestion:run": "Run and retry ingestion",
	"data-source:manage": "Manage data source credentials and licenses",
	"pilot:read": "View pilot requests",
	"pilot:manage": "Update pilot requests",
	"report:read": "View generated reports",
	"report:manage": "Revoke or delete shared reports",
} as const satisfies Record<TPermission, string>;

export const ROLE_LABEL = {
	superadmin: "Superadmin",
	admin: "Admin",
	analyst: "Analyst",
	viewer: "Viewer",
} as const satisfies Record<TRole, string>;

export const ROLE_DESCRIPTION = {
	superadmin:
		"Full access, including user management and data source credentials.",
	admin:
		"Operational access: catalog, ingestion, pilots, reports, and activity. No data source credentials.",
	analyst:
		"Curates the catalog, runs ingestion, and reads pilot requests and reports.",
	viewer:
		"Read-only access to catalog, ingestion runs, pilots, reports, and activity.",
} as const satisfies Record<TRole, string>;

const isLabelledRole = (role: string): role is TRole =>
	Object.hasOwn(ROLE_LABEL, role);

export const roleLabel = (role: string): string =>
	isLabelledRole(role) ? ROLE_LABEL[role] : role;
