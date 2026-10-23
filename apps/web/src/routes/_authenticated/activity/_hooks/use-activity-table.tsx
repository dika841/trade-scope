import { formatDateTime, orDash } from "@app/format";
import {
	ACTIVITY_ACTION_LABEL,
	ACTIVITY_ENTITY_LABEL,
	ACTIVITY_MESSAGE,
} from "@app/messages";
import {
	ACTIVITY_SORT,
	type TActivity,
	type TActivityList,
	type TActivitySort,
	type TSortDirection,
} from "@app/schemas";
import { createColumnHelper, type ReactTable } from "@tanstack/react-table";
import type { ReactElement } from "react";
import type { TTableFeatures } from "#/libs/table/features.ts";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { useServerTable } from "#/routes/_authenticated/_hooks/use-server-table.ts";
import { metadataLabel } from "#/routes/_authenticated/activity/_utils/metadata-label.ts";

const helper = createColumnHelper<TTableFeatures, TActivity>();

const getRowId = (entry: TActivity): string => entry.id;

const SORT_KEYS: readonly TActivitySort[] = [
	ACTIVITY_SORT.CREATED_AT,
	ACTIVITY_SORT.ACTION,
	ACTIVITY_SORT.RESOURCE_TYPE,
];

const columns = helper.columns([
	helper.accessor("createdAt", {
		header: ACTIVITY_MESSAGE.COLUMN_WHEN,
		meta: { className: "whitespace-nowrap text-muted-foreground" },
		cell: (context): string => formatDateTime(context.getValue()),
	}),
	helper.accessor("actorEmail", {
		header: ACTIVITY_MESSAGE.COLUMN_ACTOR,
		enableSorting: false,
		cell: (context): string => orDash(context.getValue()),
	}),
	helper.accessor("action", {
		header: ACTIVITY_MESSAGE.COLUMN_ACTION,
		cell: (context): string => ACTIVITY_ACTION_LABEL[context.getValue()],
	}),
	helper.accessor("resourceType", {
		header: ACTIVITY_MESSAGE.COLUMN_ENTITY,
		cell: (context): ReactElement => (
			<>
				<span className="text-muted-foreground">
					{ACTIVITY_ENTITY_LABEL[context.getValue()]}
				</span>{" "}
				<code className="text-xs text-muted-foreground">
					{context.row.original.resourceId}
				</code>
			</>
		),
	}),
	helper.accessor("metadata", {
		header: ACTIVITY_MESSAGE.COLUMN_DETAILS,
		enableSorting: false,
		meta: { className: "max-w-xs truncate text-xs text-muted-foreground" },
		cell: (context): string => metadataLabel(context.getValue()),
	}),
]);

export type TActivityTableInput = {
	list: TActivityList;
	sortBy: TActivitySort;
	sortDir: TSortDirection;
	onChange: TListChange<TActivitySort>;
};

export const useActivityTable = (
	input: TActivityTableInput,
): ReactTable<TTableFeatures, TActivity> =>
	useServerTable({
		columns,
		data: input.list.items,
		getRowId,
		total: input.list.total,
		page: input.list.page,
		pageSize: input.list.pageSize,
		sortBy: input.sortBy,
		sortDir: input.sortDir,
		sortKeys: SORT_KEYS,
		onChange: input.onChange,
	});
