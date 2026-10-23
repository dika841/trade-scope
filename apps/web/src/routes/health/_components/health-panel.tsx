import { HEALTH_MESSAGE } from "@app/messages";
import type { FC, ReactElement } from "react";
import { match } from "ts-pattern";
import {
	HEALTH_VIEW_STATUS,
	type THealthViewStatus,
} from "#/routes/health/_constants/status.ts";
import type { THealthState } from "#/routes/health/_hooks/use-health.ts";

const statusLabel = (status: THealthViewStatus): string =>
	match(status)
		.with(HEALTH_VIEW_STATUS.CHECKING, () => HEALTH_MESSAGE.STATUS_CHECKING)
		.with(HEALTH_VIEW_STATUS.OK, () => HEALTH_MESSAGE.STATUS_OK)
		.with(HEALTH_VIEW_STATUS.DEGRADED, () => HEALTH_MESSAGE.STATUS_DEGRADED)
		.exhaustive();

const statusClassName = (status: THealthViewStatus): string =>
	match(status)
		.with(HEALTH_VIEW_STATUS.CHECKING, () => "text-muted-foreground")
		.with(HEALTH_VIEW_STATUS.OK, () => "text-emerald-600")
		.with(HEALTH_VIEW_STATUS.DEGRADED, () => "text-red-600")
		.exhaustive();

export const HealthPanel: FC<THealthState> = (props): ReactElement => (
	<dl className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
		<dt className="text-muted-foreground">{HEALTH_MESSAGE.STATUS}</dt>
		<dd className={statusClassName(props.status)}>
			{statusLabel(props.status)}
		</dd>
		<dt className="text-muted-foreground">{HEALTH_MESSAGE.WEB_VERSION}</dt>
		<dd>{props.webVersion}</dd>
		<dt className="text-muted-foreground">{HEALTH_MESSAGE.API_VERSION}</dt>
		<dd>{props.apiVersion ?? HEALTH_MESSAGE.VERSION_UNKNOWN}</dd>
	</dl>
);
