import { DATA_SOURCE_MESSAGE } from "@app/messages";
import type { TDataSource } from "@app/schemas";
import { type ReactTable, useTable } from "@tanstack/react-table";
import type { ReactElement } from "react";
import { TABLE_FEATURES, type TTableFeatures } from "#/libs/table/features.ts";
import { DataTable } from "#/routes/_authenticated/_components/data-table.tsx";
import { dataSourceColumns } from "#/routes/_authenticated/data-sources/_components/data-source-columns.tsx";

const getRowId = (source: TDataSource): string => source.id;

const useDataSourceTable = (
	sources: readonly TDataSource[],
): ReactTable<TTableFeatures, TDataSource> =>
	useTable({
		features: TABLE_FEATURES,
		enableSorting: false,
		columns: dataSourceColumns,
		data: sources,
		getRowId,
	});

type TDataSourceTableProps = {
	sources: readonly TDataSource[];
};

export const DataSourceTable = (props: TDataSourceTableProps): ReactElement => {
	const table = useDataSourceTable(props.sources);

	return <DataTable table={table} emptyMessage={DATA_SOURCE_MESSAGE.EMPTY} />;
};
