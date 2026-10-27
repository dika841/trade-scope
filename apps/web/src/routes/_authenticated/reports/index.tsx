import { Guard } from "@app/components/guard/guard";
import { Button } from "@app/components/ui/button";
import { REPORT_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { reportListInputSchema } from "@app/schemas";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import type { FC, ReactElement } from "react";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { searchLenient } from "#/libs/table/search-lenient.ts";
import { ReportTable } from "#/routes/_authenticated/reports/_components/report-table.tsx";
import {
	reportListOptions,
	useReportList,
	useReportListChange,
} from "#/routes/_authenticated/reports/_hooks/use-reports.ts";

const reportSearchValidate = searchLenient(reportListInputSchema);

const ReportsPage: FC = (): ReactElement => {
	const { data } = useReportList();
	const search = Route.useSearch();
	const onChange = useReportListChange();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="text-xl font-semibold">{REPORT_MESSAGE.TITLE}</h1>
					<p className="text-sm text-muted-foreground">
						{REPORT_MESSAGE.SUBTITLE}
					</p>
				</div>
				<Guard permissions={[PERMISSION.REPORT_MANAGE]}>
					<Button asChild size="sm">
						<Link to="/reports/new">
							<Plus className="mr-1 size-4" />
							{REPORT_MESSAGE.NEW_REPORT}
						</Link>
					</Button>
				</Guard>
			</div>
			<ReportTable
				list={data}
				sortBy={search.sortBy}
				sortDir={search.sortDir}
				onChange={onChange}
			/>
			{data.total === 0 && (
				<div className="text-muted-foreground flex items-center gap-2 text-sm">
					<FileText className="size-4" />
					{REPORT_MESSAGE.CREATE_DESCRIPTION}
				</div>
			)}
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/reports/")({
	validateSearch: reportSearchValidate,
	beforeLoad: checkRoutePermissions({ permissions: [PERMISSION.REPORT_READ] }),
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context, deps }) =>
		context.queryClient.ensureQueryData(reportListOptions(deps.search)),
	component: ReportsPage,
});
