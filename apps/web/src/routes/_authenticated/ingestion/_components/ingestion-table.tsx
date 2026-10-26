import { INGESTION_MESSAGE } from "@app/messages";
import type {
	TIngestionRun,
	TIngestionSort,
	TSortDirection,
} from "@app/schemas";
import type { FC, ReactElement } from "react";
import { DataTable } from "#/routes/_authenticated/_components/data-table.tsx";
import { IngestionFilters } from "#/routes/_authenticated/ingestion/_components/ingestion-filters.tsx";
import { useIngestionTable } from "#/routes/_authenticated/ingestion/_hooks/use-ingestion-table.tsx";
import type { TListChange } from "#/libs/table/list-patch.ts";

type TIngestionTableProps = {
	list: {
		items: readonly TIngestionRun[];
		total: number;
		page: number;
		pageSize: number;
	};
	sortBy: TIngestionSort;
	sortDir: TSortDirection;
	onChange: TListChange<TIngestionSort>;
};

export const IngestionTable: FC<TIngestionTableProps> = (
	props,
): ReactElement => {
	const table = useIngestionTable(props);

	return (
		<DataTable
			table={table}
			emptyMessage={INGESTION_MESSAGE.EMPTY}
			toolbar={<IngestionFilters />}
			paginated
		/>
	);
};
