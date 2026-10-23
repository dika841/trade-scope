import { usePermissions } from "@app/components/guard/use-permissions";
import { A } from "@mobily/ts-belt";
import {
	NAV_ITEMS,
	type TNavItem,
} from "#/routes/_authenticated/_constants/nav.ts";

export const useVisibleNav = (): readonly TNavItem[] => {
	const { canAll } = usePermissions();
	return A.filter(NAV_ITEMS, (item) => canAll(item.permissions));
};
