import { ALL_PERMISSIONS, type TPermission } from "@app/permissions";
import { A, S } from "@mobily/ts-belt";

export type TPermissionGroup = {
	resource: string;
	permissions: readonly TPermission[];
};

const permissionResource = (permission: TPermission): string =>
	A.head(S.split(permission, ":")) ?? permission;

const RESOURCES: readonly string[] = A.uniq(
	A.map(ALL_PERMISSIONS, permissionResource),
);

export const PERMISSION_GROUPS: readonly TPermissionGroup[] = A.map(
	RESOURCES,
	(resource) => ({
		resource,
		permissions: A.filter(
			ALL_PERMISSIONS,
			(permission) => permissionResource(permission) === resource,
		),
	}),
);
