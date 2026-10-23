import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { ACTIVITY_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { activityListInputSchema } from "@app/schemas";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { searchLenient } from "#/libs/table/search-lenient.ts";
import { ActivityTable } from "#/routes/_authenticated/activity/_components/activity-table.tsx";
import {
	activityListOptions,
	useActivityList,
	useActivityListChange,
} from "#/routes/_authenticated/activity/_hooks/use-activity.ts";

const activitySearchValidate = searchLenient(activityListInputSchema);

const ActivityPage: FC = (): ReactElement => {
	const { data } = useActivityList();
	const search = Route.useSearch();
	const onChange = useActivityListChange();

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-xl font-semibold">{ACTIVITY_MESSAGE.TITLE}</h1>
			<ActivityTable
				list={data}
				sortBy={search.sortBy}
				sortDir={search.sortDir}
				onChange={onChange}
			/>
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/activity/")({
	validateSearch: activitySearchValidate,
	beforeLoad: checkRoutePermissions({
		permissions: [PERMISSION.ACTIVITY_READ],
	}),
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context, deps }) =>
		context.queryClient.ensureQueryData(activityListOptions(deps.search)),
	component: ActivityPage,
});
