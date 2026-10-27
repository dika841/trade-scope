import { Button } from "@app/components/ui/button";
import { REPORT_MESSAGE } from "@app/messages";
import type { TReportSummary } from "@app/schemas";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { DeleteConfirm } from "#/routes/_authenticated/_components/delete-confirm.tsx";
import { ReportRevokeConfirm } from "#/routes/_authenticated/reports/_components/report-revoke-confirm.tsx";
import {
	useReportDelete,
	useReportRevoke,
} from "#/routes/_authenticated/reports/_hooks/use-reports.ts";
import { shareUrlOf } from "#/routes/_authenticated/reports/_utils/share-url.ts";

type TReportActionsProps = {
	report: TReportSummary;
};

export const ReportActions = (props: TReportActionsProps): ReactElement => {
	const revoke = useReportRevoke();
	const remove = useReportDelete();

	const copy = (): void => {
		void navigator.clipboard
			.writeText(shareUrlOf(props.report.shareToken))
			.then(() => toast.success(REPORT_MESSAGE.COPIED));
	};

	return (
		<div className="flex items-center justify-end gap-2">
			<Link
				to="/reports/$reportId"
				params={{ reportId: props.report.id }}
				className="px-2 py-1 text-sm hover:underline"
			>
				{REPORT_MESSAGE.VIEW_ACTION}
			</Link>
			<Button variant="ghost" size="sm" onClick={copy}>
				{REPORT_MESSAGE.COPY_LINK}
			</Button>
			{props.report.revokedAt === null && (
				<ReportRevokeConfirm
					disabled={revoke.isPending}
					onConfirm={() => revoke.mutate({ id: props.report.id })}
				/>
			)}
			<DeleteConfirm
				title={REPORT_MESSAGE.DELETE_CONFIRM_TITLE}
				description={REPORT_MESSAGE.DELETE_CONFIRM_DESCRIPTION}
				disabled={remove.isPending}
				onConfirm={() => remove.mutate({ id: props.report.id })}
			/>
		</div>
	);
};
