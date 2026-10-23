import type { TActivityListInput, TActivitySort } from "@app/schemas";
import { D } from "@mobily/ts-belt";
import {
	type UseSuspenseQueryOptions,
	type UseSuspenseQueryResult,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { match } from "ts-pattern";
import { orpc } from "#/libs/orpc/client.ts";
import type { TClientErrors, TClientOutputs } from "#/libs/orpc/types.ts";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { ACTIVITY_FILTER_ALL } from "#/routes/_authenticated/activity/_constants/filter.ts";

type TActivityOut = TClientOutputs["activity"];
type TActivityErr = TClientErrors["activity"];

export type TActivityFilters = {
	action: string;
	resourceType: string;
	onActionChange: (next: string) => void;
	onResourceTypeChange: (next: string) => void;
};

const routeApi = getRouteApi("/_authenticated/activity/");

const filterToSearch = (value: string): string | undefined =>
	match(value)
		.with(ACTIVITY_FILTER_ALL, () => undefined)
		.otherwise((text) => text);

export const activityListOptions = (
	input: TActivityListInput,
): UseSuspenseQueryOptions<TActivityOut["list"], TActivityErr["list"]> =>
	orpc.activity.list.queryOptions({
		input,
		queryKey: orpc.activity.list.queryKey({ input }),
	});

export const useActivityList = (): UseSuspenseQueryResult<
	TActivityOut["list"],
	TActivityErr["list"]
> => useSuspenseQuery(activityListOptions(routeApi.useSearch()));

export const useActivityListChange = (): TListChange<TActivitySort> => {
	const navigate = routeApi.useNavigate();
	return (patch): void => {
		void navigate({ search: (prev) => D.merge(prev, patch) });
	};
};

export const useActivityFilters = (): TActivityFilters => {
	const navigate = routeApi.useNavigate();
	const { action, resourceType } = routeApi.useSearch();

	return {
		action: action ?? ACTIVITY_FILTER_ALL,
		resourceType: resourceType ?? ACTIVITY_FILTER_ALL,
		onActionChange: (next: string): void => {
			void navigate({
				search: (prev) =>
					D.merge(prev, { action: filterToSearch(next), page: 1 }),
			});
		},
		onResourceTypeChange: (next: string): void => {
			void navigate({
				search: (prev) =>
					D.merge(prev, { resourceType: filterToSearch(next), page: 1 }),
			});
		},
	};
};
