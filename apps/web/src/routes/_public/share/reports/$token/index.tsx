import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { REPORT_MESSAGE } from "@app/messages";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useSharedReport } from "#/routes/_authenticated/reports/_hooks/use-reports.ts";
import { ReportPreview } from "#/routes/_components/report-preview.tsx";

const SharedReportPage: FC = (): ReactElement => {
	const { token } = Route.useParams();
	const report = useSharedReport(token);

	if (report.isPending) {
		return (
			<div className="text-muted-foreground mx-auto flex w-full max-w-4xl items-center gap-2 px-6 py-12 text-sm">
				<Loader2 className="size-4 animate-spin" />
				{REPORT_MESSAGE.LOADING}
			</div>
		);
	}

	if (report.isError || !report.data) {
		return (
			<div className="mx-auto w-full max-w-3xl px-6 py-12">
				<Card>
					<CardHeader>
						<CardTitle>{REPORT_MESSAGE.SHARED_NOT_FOUND_TITLE}</CardTitle>
						<CardDescription>
							{REPORT_MESSAGE.SHARED_NOT_FOUND_BODY}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link
							to="/search"
							search={{ q: "" }}
							className="text-primary text-sm underline underline-offset-4"
						>
							{REPORT_MESSAGE.BACK_TO_SEARCH}
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
			<ReportPreview report={report.data} />
		</div>
	);
};

export const Route = createFileRoute("/_public/share/reports/$token/")({
	component: SharedReportPage,
});
