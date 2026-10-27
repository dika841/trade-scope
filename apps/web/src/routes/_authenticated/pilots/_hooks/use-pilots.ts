import { PILOT_MESSAGE } from "@app/messages";
import type { TPilotListInput, TPilotSort, TSortDirection } from "@app/schemas";
import { D } from "@mobily/ts-belt";
import {
	type UseMutationResult,
	type UseSuspenseQueryResult,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { match } from "ts-pattern";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { orpc } from "#/libs/orpc/client.ts";
import { useProcedureMutation } from "#/libs/orpc/procedure-mutation.ts";
import type {
	TClientErrors,
	TClientInputs,
	TClientOutputs,
} from "#/libs/orpc/types.ts";

type TPilotIn = TClientInputs["pilot"];
type TPilotOut = TClientOutputs["pilot"];
type TPilotErr = TClientErrors["pilot"];

export const PILOT_FILTER_ALL = "all";

const routeApi = getRouteApi("/_authenticated/pilots/");

const pilotKeys = (): readonly (readonly unknown[])[] => [orpc.pilot.key()];

const filterToSearch = (value: string): string | undefined =>
	match(value)
		.with(PILOT_FILTER_ALL, () => undefined)
		.otherwise((status) => status);

export const pilotListOptions = (input: TPilotListInput) =>
	orpc.pilot.list.queryOptions({
		input,
		queryKey: orpc.pilot.list.queryKey({ input }),
	});

export const usePilotList = (): UseSuspenseQueryResult<
	TPilotOut["list"],
	TPilotErr["list"]
> => useSuspenseQuery(pilotListOptions(routeApi.useSearch()));

export const usePilotListChange = (): TListChange<TPilotSort> => {
	const navigate = routeApi.useNavigate();

	return (patch): void => {
		void navigate({ search: (previous) => D.merge(previous, patch) });
	};
};

export const usePilotFilters = (): {
	status: string;
	onStatusChange: (next: string) => void;
} => {
	const navigate = routeApi.useNavigate();
	const { status } = routeApi.useSearch();

	return {
		status: status ?? PILOT_FILTER_ALL,
		onStatusChange: (next): void => {
			void navigate({
				search: (previous) =>
					D.merge(previous, { status: filterToSearch(next), page: 1 }),
			});
		},
	};
};

export const pilotOptionsQuery = () =>
	orpc.pilot.options.queryOptions({ queryKey: orpc.pilot.options.key() });

export const usePilotOptions = (): UseSuspenseQueryResult<
	TPilotOut["options"],
	TPilotErr["options"]
> => useSuspenseQuery(pilotOptionsQuery());

export const pilotGetOptions = (id: string) =>
	orpc.pilot.get.queryOptions({
		input: { id },
		queryKey: orpc.pilot.get.queryKey({ input: { id } }),
	});

export const usePilot = (
	id: string,
): UseSuspenseQueryResult<TPilotOut["get"], TPilotErr["get"]> =>
	useSuspenseQuery(pilotGetOptions(id));

export const usePilotCreate = (): UseMutationResult<
	TPilotOut["create"],
	TPilotErr["create"],
	TPilotIn["create"]
> =>
	useProcedureMutation(orpc.pilot.create, {
		message: PILOT_MESSAGE.CREATED,
		invalidates: pilotKeys(),
	});

export const usePilotUpdate = (): UseMutationResult<
	TPilotOut["update"],
	TPilotErr["update"],
	TPilotIn["update"]
> =>
	useProcedureMutation(orpc.pilot.update, {
		message: PILOT_MESSAGE.UPDATED,
		invalidates: pilotKeys(),
	});

export type TPilotTableInput = {
	list: {
		items: readonly TPilotOut["list"]["items"][number][];
		total: number;
		page: number;
		pageSize: number;
	};
	sortBy: TPilotSort;
	sortDir: TSortDirection;
	onChange: TListChange<TPilotSort>;
};
