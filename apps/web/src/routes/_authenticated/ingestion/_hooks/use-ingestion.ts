import { INGESTION_MESSAGE } from "@app/messages";
import {
	isIngestionTerminal,
	type TIngestionListInput,
	type TIngestionRunDetail,
	type TIngestionSort,
} from "@app/schemas";
import { D } from "@mobily/ts-belt";
import {
	type UseMutationResult,
	type UseSuspenseQueryResult,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { match } from "ts-pattern";
import { orpc } from "#/libs/orpc/client.ts";
import { useProcedureMutation } from "#/libs/orpc/procedure-mutation.ts";
import type { TListChange } from "#/libs/table/list-patch.ts";
import type {
	TClientErrors,
	TClientInputs,
	TClientOutputs,
} from "#/libs/orpc/types.ts";

type TIngestionIn = TClientInputs["ingestion"];
type TIngestionOut = TClientOutputs["ingestion"];
type TIngestionErr = TClientErrors["ingestion"];

export const INGESTION_FILTER_ALL = "all";
const LIVE_INTERVAL_MS = 2_000;

const routeApi = getRouteApi("/_authenticated/ingestion/");

const ingestionKeys = (): readonly (readonly unknown[])[] => [
	orpc.ingestion.key(),
];

const filterToSearch = (value: string): string | undefined =>
	match(value)
		.with(INGESTION_FILTER_ALL, () => undefined)
		.otherwise((status) => status);

export const ingestionListOptions = (input: TIngestionListInput) =>
	orpc.ingestion.list.queryOptions({
		input,
		queryKey: orpc.ingestion.list.queryKey({ input }),
		refetchInterval: LIVE_INTERVAL_MS,
	});

export const useIngestionList = (): UseSuspenseQueryResult<
	TIngestionOut["list"],
	TIngestionErr["list"]
> => useSuspenseQuery(ingestionListOptions(routeApi.useSearch()));

export const useIngestionListChange = (): TListChange<TIngestionSort> => {
	const navigate = routeApi.useNavigate();

	return (patch): void => {
		void navigate({ search: (previous) => D.merge(previous, patch) });
	};
};

export const useIngestionFilters = (): {
	status: string;
	onStatusChange: (next: string) => void;
} => {
	const navigate = routeApi.useNavigate();
	const { status } = routeApi.useSearch();

	return {
		status: status ?? INGESTION_FILTER_ALL,
		onStatusChange: (next: string): void => {
			void navigate({
				search: (previous) =>
					D.merge(previous, { status: filterToSearch(next), page: 1 }),
			});
		},
	};
};

export const ingestionRunOptions = (id: string) =>
	orpc.ingestion.get.queryOptions({
		input: { id },
		queryKey: orpc.ingestion.get.queryKey({ input: { id } }),
		refetchInterval: (query): number | false => {
			const data = query.state.data as TIngestionRunDetail | undefined;
			return data !== undefined && isIngestionTerminal(data.status)
				? false
				: LIVE_INTERVAL_MS;
		},
	});

export const useIngestionRun = (
	id: string,
): UseSuspenseQueryResult<TIngestionOut["get"], TIngestionErr["get"]> =>
	useSuspenseQuery(ingestionRunOptions(id));

export const ingestionStatsOptions = () =>
	orpc.ingestion.stats.queryOptions({
		queryKey: orpc.ingestion.stats.key(),
		refetchInterval: 10_000,
	});

export const useIngestionStats = (): UseSuspenseQueryResult<
	TIngestionOut["stats"],
	TIngestionErr["stats"]
> => useSuspenseQuery(ingestionStatsOptions());

export const useIngestionRunCreate = (): UseMutationResult<
	TIngestionOut["run"],
	TIngestionErr["run"],
	TIngestionIn["run"]
> =>
	useProcedureMutation(orpc.ingestion.run, {
		message: INGESTION_MESSAGE.RUN_CREATED,
		invalidates: ingestionKeys(),
	});

export const useIngestionRetry = (): UseMutationResult<
	TIngestionOut["retry"],
	TIngestionErr["retry"],
	TIngestionIn["retry"]
> =>
	useProcedureMutation(orpc.ingestion.retry, {
		message: INGESTION_MESSAGE.RETRY_CREATED,
		invalidates: ingestionKeys(),
	});
