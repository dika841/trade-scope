import { Guard } from "@app/components/guard/guard";
import { INGESTION_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { ingestionListInputSchema } from "@app/schemas";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { searchLenient } from "#/libs/table/search-lenient.ts";
import {
	dataSourceListOptions,
	useDataSourceList,
} from "#/routes/_authenticated/data-sources/_hooks/use-data-sources.ts";
import { IngestionRunForm } from "#/routes/_authenticated/ingestion/_components/ingestion-run-form.tsx";
import { IngestionTable } from "#/routes/_authenticated/ingestion/_components/ingestion-table.tsx";
import {
	ingestionListOptions,
	useIngestionList,
	useIngestionListChange,
} from "#/routes/_authenticated/ingestion/_hooks/use-ingestion.ts";

const ingestionSearchValidate = searchLenient(ingestionListInputSchema);

const IngestionPage: FC = (): ReactElement => {
	const { data } = useIngestionList();
	const { data: sources } = useDataSourceList();
	const search = Route.useSearch();
	const onChange = useIngestionListChange();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-semibold">{INGESTION_MESSAGE.TITLE}</h1>
				<p className="text-sm text-muted-foreground">
					{INGESTION_MESSAGE.SUBTITLE}
				</p>
			</div>
			<Guard permissions={[PERMISSION.INGESTION_RUN]}>
				<IngestionRunForm sources={sources.items} />
			</Guard>
			<IngestionTable
				list={data}
				sortBy={search.sortBy}
				sortDir={search.sortDir}
				onChange={onChange}
			/>
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/ingestion/")({
	validateSearch: ingestionSearchValidate,
	beforeLoad: checkRoutePermissions({
		permissions: [PERMISSION.INGESTION_READ],
	}),
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context, deps }) =>
		Promise.all([
			context.queryClient.ensureQueryData(ingestionListOptions(deps.search)),
			context.queryClient.ensureQueryData(dataSourceListOptions()),
		]),
	component: IngestionPage,
});
