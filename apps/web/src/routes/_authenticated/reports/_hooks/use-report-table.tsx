import { formatDateTime } from "@app/format";
import { REPORT_MESSAGE } from "@app/messages";
import {
	REPORT_SORT,
	type TReportSummary,
	type TReportSort,
} from "@app/schemas";
import { createColumnHelper, type ReactTable } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { TTableFeatures } from "#/libs/table/features.ts";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { useServerTable } from "#/routes/_authenticated/_hooks/use-server-table.ts";
import { ReportActions } from "#/routes/_authenticated/reports/_components/report-actions.tsx";
import { ReportStatusBadge } from "#/routes/_authenticated/reports/_components/status-badge.tsx";
import { formatHsCode } from "#/routes/_public/search/_utils/format-hs-code.ts";
import type { TSortDirection } from "@app/schemas";

const helper = createColumnHelper<TTableFeatures, TReportSummary>();

const getRowId = (report: TReportSummary): string => report.id;

const SORT_KEYS: readonly TReportSort[] = [
	REPORT_SORT.TITLE,
	REPORT_SORT.CREATED_AT,
];

const columns = helper.columns([
	helper.accessor("title", {
		header: REPORT_MESSAGE.COLUMN_REPORT,
		cell: (context): ReactElement => (
			<Link
				to="/reports/$reportId"
				params={{ reportId: context.row.original.id }}
				className="font-medium hover:underline"
			>
				{context.getValue()}
			</Link>
		),
	}),
	helper.display({
		id: "product",
		header: REPORT_MESSAGE.COLUMN_PRODUCT,
		cell: (context): ReactElement => (
			<span className="flex flex-col gap-1">
				<span className="font-mono text-sm">
					{formatHsCode(context.row.original.hsCode)}
				</span>
				<span className="text-muted-foreground text-sm">
					{context.row.original.productDescription}
				</span>
			</span>
		),
	}),
	helper.accessor("periodYear", {
		header: REPORT_MESSAGE.COLUMN_PERIOD,
		enableSorting: false,
		cell: (context): number | string => context.getValue() ?? "-",
	}),
	helper.accessor("revokedAt", {
		header: REPORT_MESSAGE.COLUMN_STATUS,
		enableSorting: false,
		cell: (context): ReactElement => (
			<ReportStatusBadge revokedAt={context.getValue()} />
		),
	}),
	helper.accessor("createdAt", {
		header: REPORT_MESSAGE.COLUMN_CREATED,
		meta: { className: "whitespace-nowrap text-muted-foreground" },
		cell: (context): string => formatDateTime(context.getValue()),
	}),
	helper.display({
		id: "actions",
		header: REPORT_MESSAGE.COLUMN_ACTIONS,
		enableHiding: false,
		meta: { className: "text-right" },
		cell: (context): ReactElement => (
			<ReportActions report={context.row.original} />
		),
	}),
]);

export type TReportTableInput = {
	list: {
		items: readonly TReportSummary[];
		total: number;
		page: number;
		pageSize: number;
	};
	sortBy: TReportSort;
	sortDir: TSortDirection;
	onChange: TListChange<TReportSort>;
};

export const useReportTable = (
	input: TReportTableInput,
): ReactTable<TTableFeatures, TReportSummary> =>
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
