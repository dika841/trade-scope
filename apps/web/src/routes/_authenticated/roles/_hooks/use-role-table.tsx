import { Badge } from "@app/components/ui/badge";
import { orDash } from "@app/format";
import { ROLE_MESSAGE } from "@app/messages";
import type { TRoleDto } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import {
	createColumnHelper,
	type ReactTable,
	useTable,
} from "@tanstack/react-table";
import type { ReactElement } from "react";
import { TABLE_FEATURES, type TTableFeatures } from "#/libs/table/features.ts";
import { RoleActionsCell } from "#/routes/_authenticated/roles/_components/role-actions-cell.tsx";

const helper = createColumnHelper<TTableFeatures, TRoleDto>();

const getRowId = (role: TRoleDto): string => role.key;

const columns = helper.columns([
	helper.accessor("label", {
		header: ROLE_MESSAGE.COLUMN_ROLE,
		cell: (context): ReactElement => (
			<span className="flex items-center gap-2 font-medium">
				{context.getValue()}
				{context.row.original.fixed && (
					<Badge variant="outline">{ROLE_MESSAGE.FIXED_BADGE}</Badge>
				)}
			</span>
		),
	}),
	helper.accessor("key", {
		header: ROLE_MESSAGE.COLUMN_KEY,
		cell: (context): ReactElement => (
			<code className="text-xs">{context.getValue()}</code>
		),
	}),
	helper.accessor("description", {
		header: ROLE_MESSAGE.COLUMN_DESCRIPTION,
		meta: { className: "text-muted-foreground" },
		cell: (context): string => orDash(context.getValue()),
	}),
	helper.accessor("permissions", {
		header: ROLE_MESSAGE.COLUMN_PERMISSIONS,
		meta: { className: "text-right" },
		cell: (context): number => A.length(context.getValue()),
	}),
	helper.accessor("memberCount", {
		header: ROLE_MESSAGE.COLUMN_MEMBERS,
		meta: { className: "text-right" },
	}),
	helper.display({
		id: "actions",
		header: ROLE_MESSAGE.COLUMN_ACTIONS,
		enableHiding: false,
		meta: { className: "text-right" },
		cell: (context): ReactElement => (
			<RoleActionsCell role={context.row.original} />
		),
	}),
]);

export const useRoleTable = (
	roles: readonly TRoleDto[],
): ReactTable<TTableFeatures, TRoleDto> =>
	useTable({
		features: TABLE_FEATURES,
		enableSorting: false,
		columns,
		data: roles,
		getRowId,
	});
