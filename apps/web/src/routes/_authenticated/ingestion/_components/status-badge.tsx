import { Badge } from "@app/components/ui/badge";
import { INGESTION_MESSAGE } from "@app/messages";
import { INGESTION_STATUS, type TIngestionStatus } from "@app/schemas";
import type { FC, ReactElement } from "react";

const LABEL: Readonly<Record<TIngestionStatus, string>> = {
	[INGESTION_STATUS.QUEUED]: INGESTION_MESSAGE.STATUS_QUEUED,
	[INGESTION_STATUS.RUNNING]: INGESTION_MESSAGE.STATUS_RUNNING,
	[INGESTION_STATUS.SUCCEEDED]: INGESTION_MESSAGE.STATUS_SUCCEEDED,
	[INGESTION_STATUS.PARTIAL]: INGESTION_MESSAGE.STATUS_PARTIAL,
	[INGESTION_STATUS.FAILED]: INGESTION_MESSAGE.STATUS_FAILED,
};

export const INGESTION_STATUS_LABEL = LABEL;

const CLASS_NAME: Readonly<Record<TIngestionStatus, string>> = {
	[INGESTION_STATUS.QUEUED]: "bg-muted text-muted-foreground",
	[INGESTION_STATUS.RUNNING]: "bg-blue-500/10 text-blue-600",
	[INGESTION_STATUS.SUCCEEDED]: "bg-emerald-500/10 text-emerald-600",
	[INGESTION_STATUS.PARTIAL]: "bg-amber-500/10 text-amber-600",
	[INGESTION_STATUS.FAILED]: "bg-destructive/10 text-destructive",
};

type TIngestionStatusBadgeProps = {
	status: TIngestionStatus;
};

export const IngestionStatusBadge: FC<TIngestionStatusBadgeProps> = (
	props,
): ReactElement => (
	<Badge variant="outline" className={CLASS_NAME[props.status]}>
		{LABEL[props.status]}
	</Badge>
);
