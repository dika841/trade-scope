import { Guard } from "@app/components/guard/guard";
import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { Input } from "@app/components/ui/input";
import { formatDate } from "@app/format";
import { REPORT_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { FC, ReactElement } from "react";
import { toast } from "sonner";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { DeleteConfirm } from "#/routes/_authenticated/_components/delete-confirm.tsx";
import { FormPage } from "#/routes/_authenticated/_components/form-page.tsx";
import { ReportRevokeConfirm } from "#/routes/_authenticated/reports/_components/report-revoke-confirm.tsx";
import { ReportStatusBadge } from "#/routes/_authenticated/reports/_components/status-badge.tsx";
import {
	reportGetOptions,
	useReport,
	useReportDelete,
	useReportRevoke,
} from "#/routes/_authenticated/reports/_hooks/use-reports.ts";
import { shareUrlOf } from "#/routes/_authenticated/reports/_utils/share-url.ts";
import { ReportPreview } from "#/routes/_components/report-preview.tsx";

const ReportDetailPage: FC = (): ReactElement => {
	const { reportId } = Route.useParams();
	const { data: report } = useReport(reportId);
	const revoke = useReportRevoke();
	const remove = useReportDelete();
	const navigate = useNavigate();
	const shareUrl = shareUrlOf(report.shareToken);

	return (
		<FormPage
			parentLabel={REPORT_MESSAGE.TITLE}
			parentTo="/reports"
			backLabel={REPORT_MESSAGE.BACK_TO_REPORTS}
			title={report.title}
			description={`${report.productDescription} · ${report.hsCode} · ${report.periodYear ?? "-"}`}
			meta={
				<div className="flex flex-wrap items-center gap-3">
					<ReportStatusBadge revokedAt={report.revokedAt} />
					<span className="text-muted-foreground text-sm">
						{REPORT_MESSAGE.GENERATED_AT}: {formatDate(report.createdAt)}
					</span>
				</div>
			}
		>
			<Card>
				<CardHeader>
					<CardTitle>{REPORT_MESSAGE.SHARE_LINK}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<div className="flex flex-col gap-2 sm:flex-row">
						<Input readOnly value={shareUrl} className="font-mono text-xs" />
						<Button
							variant="outline"
							onClick={() => {
								void navigator.clipboard
									.writeText(shareUrl)
									.then(() => toast.success(REPORT_MESSAGE.COPIED));
							}}
						>
							{REPORT_MESSAGE.COPY_LINK}
						</Button>
						<Button variant="outline" asChild>
							<a href={shareUrl} target="_blank" rel="noreferrer">
								<ExternalLink className="size-4" />
								{REPORT_MESSAGE.OPEN_SHARED}
							</a>
						</Button>
					</div>
					<Guard permissions={[PERMISSION.REPORT_MANAGE]}>
						<div className="flex items-center gap-2">
							{report.revokedAt === null && (
								<ReportRevokeConfirm
									disabled={revoke.isPending}
									onConfirm={() => revoke.mutate({ id: report.id })}
								/>
							)}
							<DeleteConfirm
								title={REPORT_MESSAGE.DELETE_CONFIRM_TITLE}
								description={REPORT_MESSAGE.DELETE_CONFIRM_DESCRIPTION}
								disabled={remove.isPending}
								onConfirm={() =>
									remove.mutate(
										{ id: report.id },
										{ onSuccess: () => void navigate({ to: "/reports" }) },
									)
								}
							/>
						</div>
					</Guard>
				</CardContent>
			</Card>

			<ReportPreview
				report={{
					title: report.title,
					hsCode: report.hsCode,
					hsRevision: report.hsRevision,
					productDescription: report.productDescription,
					createdAt: report.createdAt,
					payload: report.payload,
				}}
			/>
		</FormPage>
	);
};

export const Route = createFileRoute("/_authenticated/reports/$reportId")({
	beforeLoad: checkRoutePermissions({ permissions: [PERMISSION.REPORT_READ] }),
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(reportGetOptions(params.reportId)),
	component: ReportDetailPage,
});
