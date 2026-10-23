import type { TSortDirection } from "@app/schemas";

export type TListPatch<TSort extends string> = {
	page?: number;
	pageSize?: number;
	sortBy?: TSort;
	sortDir?: TSortDirection;
};

export type TListChange<TSort extends string> = (
	patch: TListPatch<TSort>,
) => void;
