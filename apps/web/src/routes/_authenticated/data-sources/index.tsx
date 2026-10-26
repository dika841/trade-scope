import { DATA_SOURCE_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { DataSourceCreateForm } from "#/routes/_authenticated/data-sources/_components/data-source-create-form.tsx";
import { DataSourceTable } from "#/routes/_authenticated/data-sources/_components/data-source-table.tsx";
import {
	dataSourceListOptions,
	useDataSourceList,
} from "#/routes/_authenticated/data-sources/_hooks/use-data-sources.ts";

const DataSourcesPage: FC = (): ReactElement => {
	const { data } = useDataSourceList();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-semibold">{DATA_SOURCE_MESSAGE.TITLE}</h1>
				<p className="text-sm text-muted-foreground">
					{DATA_SOURCE_MESSAGE.SUBTITLE}
				</p>
			</div>
			<DataSourceCreateForm />
			<DataSourceTable sources={data.items} />
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/data-sources/")({
	beforeLoad: checkRoutePermissions({
		permissions: [PERMISSION.DATA_SOURCE_MANAGE],
	}),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(dataSourceListOptions()),
	component: DataSourcesPage,
});
