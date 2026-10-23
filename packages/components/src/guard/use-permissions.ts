import { canAll, canAny, type TPermission } from "@app/permissions";
import { useGrantedPermissions } from "./permissions-provider.tsx";

export type TUsePermissions = {
	permissions: readonly TPermission[];
	canAll: (required: readonly TPermission[]) => boolean;
	canAny: (required: readonly TPermission[]) => boolean;
};

export const usePermissions = (): TUsePermissions => {
	const permissions = useGrantedPermissions();

	return {
		permissions,
		canAll: (required: readonly TPermission[]): boolean =>
			canAll(permissions, required),
		canAny: (required: readonly TPermission[]): boolean =>
			canAny(permissions, required),
	};
};
