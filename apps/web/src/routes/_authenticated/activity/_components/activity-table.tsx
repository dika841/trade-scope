import { ACTIVITY_MESSAGE } from "@app/messages";
import type { FC, ReactElement } from "react";
import { DataTable } from "#/routes/_authenticated/_components/data-table.tsx";
import { ActivityFilters } from "#/routes/_authenticated/activity/_components/activity-filters.tsx";
import {
	type TActivityTableInput,
	useActivityTable,
} from "#/routes/_authenticated/activity/_hooks/use-activity-table.tsx";

export const ActivityTable: FC<TActivityTableInput> = (props): ReactElement => {
	const table = useActivityTable(props);

	return (
		<DataTable
			table={table}
			emptyMessage={ACTIVITY_MESSAGE.EMPTY}
			toolbar={<ActivityFilters />}
			paginated
		/>
	);
};
