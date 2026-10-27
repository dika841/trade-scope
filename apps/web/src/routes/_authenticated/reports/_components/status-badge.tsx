import { Badge } from "@app/components/ui/badge";
import { REPORT_MESSAGE } from "@app/messages";
import type { FC, ReactElement } from "react";

type TReportStatusBadgeProps = {
	revokedAt: string | null;
};

export const ReportStatusBadge: FC<TReportStatusBadgeProps> = (
	props,
): ReactElement => (
	<Badge
		variant="outline"
		className={
			props.revokedAt === null
				? "border-emerald-600/40 text-emerald-600"
				: "text-muted-foreground"
		}
	>
		{props.revokedAt === null
			? REPORT_MESSAGE.STATUS_ACTIVE
			: REPORT_MESSAGE.STATUS_REVOKED}
	</Badge>
);
