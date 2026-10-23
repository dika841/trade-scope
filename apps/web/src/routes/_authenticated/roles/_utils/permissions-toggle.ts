import type { TPermission } from "@app/permissions";
import { A } from "@mobily/ts-belt";

export const permissionsToggle = (
	current: readonly TPermission[],
	permission: TPermission,
	checked: boolean,
): readonly TPermission[] =>
	checked
		? A.uniq(A.append(current, permission))
		: A.reject(current, (granted) => granted === permission);
