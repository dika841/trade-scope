import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@app/components/ui/table";
import { SORT_DIRECTION } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import {
	type Column,
	flexRender,
	type Header,
	type ReactTable,
	type RowData,
} from "@tanstack/react-table";
import type { ReactElement, ReactNode } from "react";
import { match } from "ts-pattern";
import type { TTableFeatures } from "#/libs/table/features.ts";
import {
	DataTableColumnsMenu,
	type TColumnToggle,
} from "#/routes/_authenticated/_components/data-table-columns-menu.tsx";
import { DataTablePagination } from "#/routes/_authenticated/_components/data-table-pagination.tsx";
import { DataTableSortButton } from "#/routes/_authenticated/_components/data-table-sort-button.tsx";
import { EmptyState } from "#/routes/_authenticated/_components/empty-state.tsx";

const ARIA_SORT = {
	ASCENDING: "ascending",
	DESCENDING: "descending",
	NONE: "none",
} as const;

type TAriaSort = (typeof ARIA_SORT)[keyof typeof ARIA_SORT];

const ariaSortFor = <TData extends RowData>(
	column: Column<TTableFeatures, TData, unknown>,
): TAriaSort | undefined =>
	match({ sortable: column.getCanSort(), sorted: column.getIsSorted() })
		.with({ sortable: false }, (): undefined => undefined)
		.with({ sorted: SORT_DIRECTION.ASC }, (): TAriaSort => ARIA_SORT.ASCENDING)
		.with(
			{ sorted: SORT_DIRECTION.DESC },
			(): TAriaSort => ARIA_SORT.DESCENDING,
		)
		.otherwise((): TAriaSort => ARIA_SORT.NONE);

type TDataTableProps<TData extends RowData> = {
	table: ReactTable<TTableFeatures, TData>;
	emptyMessage: string;
	toolbar?: ReactNode;
	paginated?: boolean;
};

const columnLabel = <TData extends RowData>(
	column: Column<TTableFeatures, TData, unknown>,
): string =>
	match(column.columnDef.header)
		.with(undefined, () => column.id)
		.otherwise((header) => (typeof header === "string" ? header : column.id));

const toToggle = <TData extends RowData>(
	column: Column<TTableFeatures, TData, unknown>,
): TColumnToggle => ({
	id: column.id,
	label: columnLabel(column),
	visible: column.getIsVisible(),
	toggle: () => column.toggleVisibility(),
});

const headerContent = <TData extends RowData>(
	header: Header<TTableFeatures, TData, unknown>,
): ReactNode =>
	match(header.column.getCanSort())
		.with(true, () => (
			<DataTableSortButton
				label={flexRender(header.column.columnDef.header, header.getContext())}
				sorted={header.column.getIsSorted()}
				onToggle={() => header.column.toggleSorting()}
			/>
		))
		.otherwise(() =>
			flexRender(header.column.columnDef.header, header.getContext()),
		);

export const DataTable = <TData extends RowData>(
	props: TDataTableProps<TData>,
): ReactElement => {
	const { paginated = false } = props;
	const hideable = A.filter(props.table.getAllLeafColumns(), (column) =>
		column.getCanHide(),
	);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-4">
				{props.toolbar}
				<DataTableColumnsMenu columns={A.map(hideable, toToggle)} />
			</div>
			<Table>
				<TableHeader>
					{A.map(props.table.getHeaderGroups(), (group) => (
						<TableRow key={group.id}>
							{A.map(group.headers, (header) => (
								<TableHead
									key={header.id}
									aria-sort={ariaSortFor(header.column)}
									className={header.column.columnDef.meta?.className}
								>
									{!header.isPlaceholder && headerContent(header)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{match(props.table.getRowModel().rows)
						.when(A.isEmpty, () => (
							<TableRow>
								<TableCell
									colSpan={A.length(props.table.getVisibleLeafColumns())}
								>
									<EmptyState message={props.emptyMessage} />
								</TableCell>
							</TableRow>
						))
						.otherwise((rows) =>
							A.map(rows, (row) => (
								<TableRow key={row.id}>
									{A.map(row.getVisibleCells(), (cell) => (
										<TableCell
											key={cell.id}
											className={cell.column.columnDef.meta?.className}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							)),
						)}
				</TableBody>
			</Table>
			{paginated && (
				<DataTablePagination
					pageIndex={props.table.state.pagination.pageIndex}
					pageSize={props.table.state.pagination.pageSize}
					pageCount={props.table.getPageCount()}
					rowCount={props.table.getRowCount()}
					canPrevious={props.table.getCanPreviousPage()}
					canNext={props.table.getCanNextPage()}
					onPageIndexChange={(index) => props.table.setPageIndex(index)}
					onPageSizeChange={(size) => props.table.setPageSize(size)}
				/>
			)}
		</div>
	);
};
