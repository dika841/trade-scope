import type { TPermission } from "./permissions.ts";

export const canAll = (
	granted: readonly TPermission[],
	required: readonly TPermission[],
): boolean => required.every((permission) => granted.includes(permission));

export const canAny = (
	granted: readonly TPermission[],
	required: readonly TPermission[],
): boolean => required.some((permission) => granted.includes(permission));
