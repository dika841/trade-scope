import { PILOT_MESSAGE } from "@app/messages";
import type { TPilot, TPilotSort, TSortDirection } from "@app/schemas";
import type { FC, ReactElement } from "react";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { DataTable } from "#/routes/_authenticated/_components/data-table.tsx";
import { PilotFilters } from "#/routes/_authenticated/pilots/_components/pilot-filters.tsx";
import { usePilotTable } from "#/routes/_authenticated/pilots/_hooks/use-pilot-table.tsx";

type TPilotTableProps = {
	list: {
		items: readonly TPilot[];
		total: number;
		page: number;
		pageSize: number;
	};
	sortBy: TPilotSort;
	sortDir: TSortDirection;
	onChange: TListChange<TPilotSort>;
};

export const PilotTable: FC<TPilotTableProps> = (props): ReactElement => {
	const table = usePilotTable(props);

	return (
		<DataTable
			table={table}
			emptyMessage={PILOT_MESSAGE.EMPTY}
			toolbar={<PilotFilters />}
			paginated
		/>
	);
};
