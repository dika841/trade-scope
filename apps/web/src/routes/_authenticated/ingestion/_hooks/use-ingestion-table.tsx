import { formatDateTime, orDash } from "@app/format";
import { INGESTION_MESSAGE } from "@app/messages";
import {
	INGESTION_MODE,
	INGESTION_SORT,
	type TIngestionRun,
	type TIngestionSort,
	type TSortDirection,
} from "@app/schemas";
import { createColumnHelper, type ReactTable } from "@tanstack/react-table";
import type { ReactElement } from "react";
import type { TTableFeatures } from "#/libs/table/features.ts";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { useServerTable } from "#/routes/_authenticated/_hooks/use-server-table.ts";
import { IngestionActionsCell } from "#/routes/_authenticated/ingestion/_components/ingestion-actions-cell.tsx";
import { IngestionStatusBadge } from "#/routes/_authenticated/ingestion/_components/status-badge.tsx";
import { formatDuration } from "#/routes/_authenticated/ingestion/_utils/duration.ts";

const helper = createColumnHelper<TTableFeatures, TIngestionRun>();

const getRowId = (run: TIngestionRun): string => run.id;

const SORT_KEYS: readonly TIngestionSort[] = [
	INGESTION_SORT.CREATED_AT,
	INGESTION_SORT.STATUS,
];

const columns = helper.columns([
	helper.accessor("createdAt", {
		header: INGESTION_MESSAGE.COLUMN_WHEN,
		meta: { className: "whitespace-nowrap text-muted-foreground" },
		cell: (context): string => formatDateTime(context.getValue()),
	}),
	helper.display({
		id: "source",
		header: INGESTION_MESSAGE.COLUMN_SOURCE,
		cell: (context): string =>
			orDash(context.row.original.sourceName ?? context.row.original.fileName),
	}),
	helper.display({
		id: "mode",
		header: INGESTION_MESSAGE.COLUMN_MODE,
		cell: (context): string =>
			context.row.original.mode === INGESTION_MODE.SOURCE
				? INGESTION_MESSAGE.MODE_SOURCE
				: INGESTION_MESSAGE.MODE_UPLOAD,
	}),
	helper.accessor("status", {
		header: INGESTION_MESSAGE.COLUMN_STATUS,
		cell: (context): ReactElement => (
			<IngestionStatusBadge status={context.getValue()} />
		),
	}),
	helper.accessor("totalRows", {
		header: INGESTION_MESSAGE.COLUMN_TOTAL,
		enableSorting: false,
		meta: { className: "text-right" },
	}),
	helper.accessor("insertedRows", {
		header: INGESTION_MESSAGE.COLUMN_INSERTED,
		enableSorting: false,
		meta: { className: "text-right" },
	}),
	helper.accessor("updatedRows", {
		header: INGESTION_MESSAGE.COLUMN_UPDATED,
		enableSorting: false,
		meta: { className: "text-right" },
	}),
	helper.accessor("failedRows", {
		header: INGESTION_MESSAGE.COLUMN_FAILED,
		enableSorting: false,
		meta: { className: "text-right" },
	}),
	helper.display({
		id: "duration",
		header: INGESTION_MESSAGE.COLUMN_DURATION,
		cell: (context): string =>
			formatDuration(
				context.row.original.startedAt,
				context.row.original.finishedAt,
			),
	}),
	helper.accessor("triggeredByEmail", {
		header: INGESTION_MESSAGE.COLUMN_TRIGGERED_BY,
		enableSorting: false,
		cell: (context): string => orDash(context.getValue()),
	}),
	helper.display({
		id: "actions",
		header: INGESTION_MESSAGE.COLUMN_ACTIONS,
		enableHiding: false,
		meta: { className: "text-right" },
		cell: (context): ReactElement => (
			<IngestionActionsCell run={context.row.original} />
		),
	}),
]);

export type TIngestionTableInput = {
	list: {
		items: readonly TIngestionRun[];
		total: number;
		page: number;
		pageSize: number;
	};
	sortBy: TIngestionSort;
	sortDir: TSortDirection;
	onChange: TListChange<TIngestionSort>;
};

export const useIngestionTable = (
	input: TIngestionTableInput,
): ReactTable<TTableFeatures, TIngestionRun> =>
	useServerTable({
		columns,
		data: input.list.items,
		getRowId,
		total: input.list.total,
		page: input.list.page,
		pageSize: input.list.pageSize,
		sortBy: input.sortBy,
		sortDir: input.sortDir,
		sortKeys: SORT_KEYS,
		onChange: input.onChange,
	});
