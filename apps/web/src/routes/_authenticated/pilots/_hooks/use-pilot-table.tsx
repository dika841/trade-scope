import { formatDateTime, orDash } from "@app/format";
import { PILOT_MESSAGE } from "@app/messages";
import {
	PILOT_SORT,
	type TPilot,
	type TPilotSort,
	type TSortDirection,
} from "@app/schemas";
import { createColumnHelper, type ReactTable } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { TTableFeatures } from "#/libs/table/features.ts";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { useServerTable } from "#/routes/_authenticated/_hooks/use-server-table.ts";
import { PilotStatusBadge } from "#/routes/_authenticated/pilots/_components/status-badge.tsx";
import { formatHsCode } from "#/routes/_public/search/_utils/format-hs-code.ts";

const helper = createColumnHelper<TTableFeatures, TPilot>();

const getRowId = (pilot: TPilot): string => pilot.id;

const SORT_KEYS: readonly TPilotSort[] = [
	PILOT_SORT.CREATED_AT,
	PILOT_SORT.STATUS,
];

const columns = helper.columns([
	helper.display({
		id: "product",
		header: PILOT_MESSAGE.COLUMN_PRODUCT,
		cell: (context): ReactElement => (
			<Link
				to="/pilots/$pilotId"
				params={{ pilotId: context.row.original.id }}
				className="flex flex-col gap-1"
			>
				<span className="font-mono text-sm">
					{formatHsCode(context.row.original.hsCode)}
				</span>
				<span className="text-muted-foreground text-sm">
					{context.row.original.productDescription}
				</span>
			</Link>
		),
	}),
	helper.accessor("marketName", {
		header: PILOT_MESSAGE.COLUMN_MARKET,
		enableSorting: false,
		cell: (context): string =>
			`${context.getValue()} (${context.row.original.marketIso2})`,
	}),
	helper.accessor("status", {
		header: PILOT_MESSAGE.COLUMN_STATUS,
		cell: (context): ReactElement => (
			<PilotStatusBadge status={context.getValue()} />
		),
	}),
	helper.display({
		id: "owner",
		header: PILOT_MESSAGE.COLUMN_OWNER,
		cell: (context): string =>
			orDash(context.row.original.ownerName ?? context.row.original.ownerEmail),
	}),
	helper.accessor("updatedAt", {
		header: PILOT_MESSAGE.COLUMN_UPDATED,
		enableSorting: false,
		meta: { className: "whitespace-nowrap text-muted-foreground" },
		cell: (context): string => formatDateTime(context.getValue()),
	}),
]);

export type TPilotTableInput = {
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

export const usePilotTable = (
	input: TPilotTableInput,
): ReactTable<TTableFeatures, TPilot> =>
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
