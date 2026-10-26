import { DATA_SOURCE_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { FormPage } from "#/routes/_authenticated/_components/form-page.tsx";
import { DataSourceEditForm } from "#/routes/_authenticated/data-sources/_components/data-source-edit-form.tsx";
import {
	dataSourceGetOptions,
	useDataSourceGet,
} from "#/routes/_authenticated/data-sources/_hooks/use-data-sources.ts";

const DataSourceEditPage: FC = (): ReactElement => {
	const { sourceId } = Route.useParams();
	const { data } = useDataSourceGet(sourceId);

	return (
		<FormPage
			parentLabel={DATA_SOURCE_MESSAGE.TITLE}
			parentTo="/data-sources"
			backLabel={DATA_SOURCE_MESSAGE.BACK_TO_SOURCES}
			title={data.name}
			description={DATA_SOURCE_MESSAGE.EDIT_DESCRIPTION}
		>
			<DataSourceEditForm source={data} />
		</FormPage>
	);
};

export const Route = createFileRoute("/_authenticated/data-sources/$sourceId")({
	beforeLoad: checkRoutePermissions({
		permissions: [PERMISSION.DATA_SOURCE_MANAGE],
	}),
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(dataSourceGetOptions(params.sourceId)),
	component: DataSourceEditPage,
});
