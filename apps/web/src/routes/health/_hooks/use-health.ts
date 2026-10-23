import { APP_VERSION } from "@app/version";
import { HEALTH_STATUS } from "@app/schemas";
import { useQuery } from "@tanstack/react-query";
import { match } from "ts-pattern";
import { orpc } from "#/libs/orpc/client.ts";
import {
	HEALTH_VIEW_STATUS,
	type THealthViewStatus,
} from "#/routes/health/_constants/status.ts";

export type THealthState = {
	status: THealthViewStatus;
	webVersion: string;
	apiVersion: string | null;
};

export const useHealth = (): THealthState => {
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
