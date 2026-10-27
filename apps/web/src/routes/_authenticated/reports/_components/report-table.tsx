import { REPORT_MESSAGE } from "@app/messages";
import type { TReportSort, TReportSummary, TSortDirection } from "@app/schemas";
import type { FC, ReactElement } from "react";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { DataTable } from "#/routes/_authenticated/_components/data-table.tsx";
import { useReportTable } from "#/routes/_authenticated/reports/_hooks/use-report-table.tsx";

type TReportTableProps = {
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

export const ReportTable: FC<TReportTableProps> = (props): ReactElement => {
	const table = useReportTable(props);

	return (
		<DataTable table={table} emptyMessage={REPORT_MESSAGE.EMPTY} paginated />
	);
};
