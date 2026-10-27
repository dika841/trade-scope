import { Badge } from "@app/components/ui/badge";
import { PILOT_STATUS_LABEL } from "@app/messages";
import { PILOT_STATUS, type TPilotStatus } from "@app/schemas";
import type { FC, ReactElement } from "react";

const VARIANT: Readonly<Record<TPilotStatus, "default" | "outline">> = {
	[PILOT_STATUS.NEW]: "outline",
	[PILOT_STATUS.IN_REVIEW]: "default",
	[PILOT_STATUS.APPROVED]: "outline",
	[PILOT_STATUS.REJECTED]: "outline",
	[PILOT_STATUS.COMPLETED]: "outline",
};

const CLASS_NAME: Readonly<Record<TPilotStatus, string | undefined>> = {
	[PILOT_STATUS.NEW]: "text-muted-foreground",
	[PILOT_STATUS.IN_REVIEW]: undefined,
	[PILOT_STATUS.APPROVED]: "border-emerald-600/40 text-emerald-600",
	[PILOT_STATUS.REJECTED]: "border-destructive/40 text-destructive",
	[PILOT_STATUS.COMPLETED]: "border-emerald-600/40 text-emerald-600",
};

type TPilotStatusBadgeProps = {
	status: TPilotStatus;
};

export const PilotStatusBadge: FC<TPilotStatusBadgeProps> = (
	props,
): ReactElement => (
	<Badge variant={VARIANT[props.status]} className={CLASS_NAME[props.status]}>
		{PILOT_STATUS_LABEL[props.status]}
	</Badge>
);
