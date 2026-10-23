import { SORT_DIRECTION, type TSortDirection } from "@app/schemas";
import { A, O } from "@mobily/ts-belt";
import {
	type PaginationState,
	type ReactTable,
	type RowData,
	type SortingState,
	type TableOptions,
	type Updater,
	useTable,
} from "@tanstack/react-table";
import { TABLE_FEATURES, type TTableFeatures } from "#/libs/table/features.ts";
import type { TListChange } from "#/libs/table/list-patch.ts";

export type TServerTableOptions<TData extends RowData, TSort extends string> = {
	columns: TableOptions<TTableFeatures, TData>["columns"];
	data: readonly TData[];
	getRowId: (row: TData) => string;
	total: number;
	page: number;
	pageSize: number;
	sortBy: TSort;
	sortDir: TSortDirection;
	sortKeys: readonly TSort[];
	onChange: TListChange<TSort>;
};

const resolveSorting = (
	updater: Updater<SortingState>,
	previous: SortingState,
): SortingState =>
	typeof updater === "function" ? updater(previous) : updater;

const resolvePagination = (
	updater: Updater<PaginationState>,
	previous: PaginationState,
): PaginationState =>
	typeof updater === "function" ? updater(previous) : updater;

const directionOf = (desc: boolean): TSortDirection =>
	desc ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;

export const useServerTable = <TData extends RowData, TSort extends string>(
	options: TServerTableOptions<TData, TSort>,
): ReactTable<TTableFeatures, TData> => {
	const sorting: SortingState = [
		{ id: options.sortBy, desc: options.sortDir === SORT_DIRECTION.DESC },
	];
	const pagination: PaginationState = {
		pageIndex: options.page - 1,
		pageSize: options.pageSize,
	};

	return useTable({
		features: TABLE_FEATURES,
		columns: options.columns,
		data: options.data,
		getRowId: options.getRowId,
		manualSorting: true,
		manualPagination: true,
		enableMultiSort: false,
		enableSortingRemoval: false,
		rowCount: options.total,
		state: { sorting, pagination },
		onSortingChange: (updater): void => {
			const first = A.head(resolveSorting(updater, sorting));
			const sortBy = A.find(options.sortKeys, (key) => key === first?.id);
			O.match(
				sortBy,
				(key): void =>
					options.onChange({
						sortBy: key,
						sortDir: directionOf(first?.desc === true),
						page: 1,
					}),
				(): void => undefined,
			);
		},
		onPaginationChange: (updater): void => {
			const next = resolvePagination(updater, pagination);
			options.onChange({ page: next.pageIndex + 1, pageSize: next.pageSize });
		},
	});
};
