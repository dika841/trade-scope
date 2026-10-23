import { A } from "@mobily/ts-belt";
import { useSuspenseQuery } from "@tanstack/react-query";
import { roleListOptions } from "#/routes/_authenticated/roles/_hooks/use-roles.ts";

export type TRoleOption = {
	value: string;
	label: string;
};

export const useRoleOptions = (): readonly TRoleOption[] => {
	const { data } = useSuspenseQuery(roleListOptions());

	return A.map(data.items, (role) => ({
		value: role.key,
		label: role.label,
	}));
};
