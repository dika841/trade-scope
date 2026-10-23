import { HEALTH_STATUS } from "@app/schemas";
import { APP_VERSION } from "@app/version";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";
import { orpc } from "#/libs/orpc/client.ts";
import { suspenseQueryOptionsFor } from "#/libs/orpc/procedure-query.ts";
import type { TClientOutputs } from "#/libs/orpc/types.ts";
import {
	HEALTH_VIEW_STATUS,
	type THealthViewStatus,
} from "#/routes/health/_constants/status.ts";

type TActivityOut = TClientOutputs["activity"];

const COUNT_ONLY = { page: 1, pageSize: 1 } as const;
const RECENT_FIVE = { page: 1, pageSize: 5 } as const;

export type TDashboardHealth = {
	status: THealthViewStatus;
	webVersion: string;
	apiVersion: string | null;
};

export const useDashboardUsers = (): { total: number } => {
	const { data } = useSuspenseQuery(
		suspenseQueryOptionsFor(orpc.user.list, COUNT_ONLY),
	);
	return { total: data.total };
};

export const useDashboardRoles = (): { total: number } => {
	const { data } = useSuspenseQuery(
		suspenseQueryOptionsFor(orpc.role.list, undefined),
	);
	return { total: data.items.length };
};

export const useDashboardActivity = (): TActivityOut["list"] => {
	const { data } = useSuspenseQuery(
		suspenseQueryOptionsFor(orpc.activity.list, RECENT_FIVE),
	);
	return data;
};

export const useDashboardHealth = (): TDashboardHealth => {
	const query = useQuery(
		orpc.health.check.queryOptions({ queryKey: orpc.health.check.key() }),
	);

	const status = match(query)
		.with(
			{ isPending: true },
			(): THealthViewStatus => HEALTH_VIEW_STATUS.CHECKING,
		)
		.with(
			{ data: { status: HEALTH_STATUS.OK } },
			(): THealthViewStatus => HEALTH_VIEW_STATUS.OK,
		)
		.otherwise((): THealthViewStatus => HEALTH_VIEW_STATUS.DEGRADED);

	return {
		status,
		webVersion: APP_VERSION,
		apiVersion: query.data?.version ?? null,
	};
};
