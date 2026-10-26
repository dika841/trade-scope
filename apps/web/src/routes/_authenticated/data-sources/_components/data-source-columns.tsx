import { Badge } from "@app/components/ui/badge";
import { Switch } from "@app/components/ui/switch";
import { formatDateTime, orDash } from "@app/format";
import { DATA_SOURCE_MESSAGE } from "@app/messages";
import type { TDataSource } from "@app/schemas";
import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { TTableFeatures } from "#/libs/table/features.ts";
import { DeleteConfirm } from "#/routes/_authenticated/_components/delete-confirm.tsx";
import {
	useDataSourceDelete,
	useDataSourceUpdate,
} from "#/routes/_authenticated/data-sources/_hooks/use-data-sources.ts";

const helper = createColumnHelper<TTableFeatures, TDataSource>();

const ActionsCell = (props: { source: TDataSource }): ReactElement => {
	const update = useDataSourceUpdate();
	const remove = useDataSourceDelete();

	return (
		<div className="flex items-center justify-end gap-2">
			<Switch
				aria-label={DATA_SOURCE_MESSAGE.FIELD_ACTIVE}
				checked={props.source.isActive}
				disabled={update.isPending}
				onCheckedChange={(checked) =>
					update.mutate({ id: props.source.id, isActive: checked })
				}
			/>
			<Link
				to="/data-sources/$sourceId"
				params={{ sourceId: props.source.id }}
				className="px-2 py-1 text-sm hover:underline"
			>
				{DATA_SOURCE_MESSAGE.EDIT_TITLE}
			</Link>
			<DeleteConfirm
				title={DATA_SOURCE_MESSAGE.DELETE_CONFIRM_TITLE}
				description={DATA_SOURCE_MESSAGE.DELETE_CONFIRM_DESCRIPTION}
				disabled={remove.isPending}
				onConfirm={() => remove.mutate({ id: props.source.id })}
			/>
		</div>
	);
};

export const dataSourceColumns = helper.columns([
	helper.accessor("name", {
		header: DATA_SOURCE_MESSAGE.COLUMN_NAME,
		cell: (context): ReactElement => (
			<span className="font-medium">{context.getValue()}</span>
		),
	}),
	helper.accessor("url", {
		header: DATA_SOURCE_MESSAGE.COLUMN_URL,
		cell: (context): ReactElement => (
			<code className="block max-w-md truncate text-xs text-muted-foreground">
				{context.getValue()}
			</code>
		),
	}),
	helper.accessor("isActive", {
		header: DATA_SOURCE_MESSAGE.COLUMN_STATUS,
		cell: (context): ReactElement => (
			<Badge variant="outline">
				{context.getValue()
					? DATA_SOURCE_MESSAGE.ACTIVE
					: DATA_SOURCE_MESSAGE.INACTIVE}
			</Badge>
		),
	}),
	helper.accessor("secretHint", {
		header: DATA_SOURCE_MESSAGE.COLUMN_SECRET,
		cell: (context): string =>
			orDash(context.getValue() === null ? null : `•••• ${context.getValue()}`),
	}),
	helper.accessor("updatedAt", {
		header: DATA_SOURCE_MESSAGE.COLUMN_UPDATED,
		cell: (context): string => formatDateTime(context.getValue()),
	}),
	helper.display({
		id: "actions",
		header: DATA_SOURCE_MESSAGE.COLUMN_ACTIONS,
		enableHiding: false,
		meta: { className: "text-right" },
		cell: (context): ReactElement => (
			<ActionsCell source={context.row.original} />
		),
	}),
]);
