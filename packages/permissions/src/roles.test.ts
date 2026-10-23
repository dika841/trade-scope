import { describe, expect, it } from "vitest";
import { canAll, canAny } from "./can.ts";
import { PERMISSION } from "./permissions.ts";
import { permissionsForRole, ROLE } from "./roles.ts";

describe("permissionsForRole", () => {
	it("grants every permission to superadmin", (): void => {
		const granted = permissionsForRole(ROLE.SUPERADMIN);
		expect(
			canAll(granted, [
				PERMISSION.USER_MANAGE,
				PERMISSION.DATA_SOURCE_MANAGE,
				PERMISSION.INGESTION_RUN,
				PERMISSION.ACTIVITY_READ,
			]),
		).toBe(true);
	});

	it("gives admin the operational set without the data source credentials", (): void => {
		const granted = permissionsForRole(ROLE.ADMIN);
		expect(
			canAll(granted, [
				PERMISSION.USER_MANAGE,
				PERMISSION.CATALOG_MANAGE,
				PERMISSION.INGESTION_RUN,
				PERMISSION.PILOT_MANAGE,
				PERMISSION.REPORT_MANAGE,
				PERMISSION.ACTIVITY_READ,
			]),
		).toBe(true);
		expect(canAny(granted, [PERMISSION.DATA_SOURCE_MANAGE])).toBe(false);
	});

	it("lets analyst run ingestion but not manage users or pilots", (): void => {
		const granted = permissionsForRole(ROLE.ANALYST);
		expect(
			canAll(granted, [
				PERMISSION.CATALOG_MANAGE,
				PERMISSION.INGESTION_RUN,
				PERMISSION.PILOT_READ,
				PERMISSION.REPORT_READ,
			]),
		).toBe(true);
		expect(
			canAny(granted, [
				PERMISSION.USER_MANAGE,
				PERMISSION.PILOT_MANAGE,
				PERMISSION.DATA_SOURCE_MANAGE,
			]),
		).toBe(false);
	});

	it("keeps viewer read-only", (): void => {
		const granted = permissionsForRole(ROLE.VIEWER);
		expect(
			canAll(granted, [
				PERMISSION.CATALOG_READ,
				PERMISSION.INGESTION_READ,
				PERMISSION.PILOT_READ,
				PERMISSION.REPORT_READ,
			]),
		).toBe(true);
		expect(
			canAny(granted, [
				PERMISSION.CATALOG_MANAGE,
				PERMISSION.INGESTION_RUN,
				PERMISSION.PILOT_MANAGE,
				PERMISSION.REPORT_MANAGE,
				PERMISSION.USER_MANAGE,
				PERMISSION.ACTIVITY_READ,
			]),
		).toBe(false);
	});
});
