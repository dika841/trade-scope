import { PERMISSION_MESSAGE } from "@app/messages";
import { PERMISSION_LABEL } from "@app/messages";
import { ALL_PERMISSIONS, type TPermission } from "@app/permissions";
import type { TRoleDto } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import {
	createColumnHelper,
	type DisplayColumnDef,
	type ReactTable,
	useTable,
} from "@tanstack/react-table";
import { Check } from "lucide-react";
import type { ReactElement } from "react";
import { TABLE_FEATURES, type TTableFeatures } from "#/libs/table/features.ts";
import { useRoleList } from "#/routes/_authenticated/roles/_hooks/use-roles.ts";

type TPermissionRow = {
	permission: TPermission;
};

const helper = createColumnHelper<TTableFeatures, TPermissionRow>();

const ROWS: readonly TPermissionRow[] = A.map(
	ALL_PERMISSIONS,
	(permission) => ({ permission }),
);

const getRowId = (row: TPermissionRow): string => row.permission;

const permissionColumn = helper.accessor("permission", {
	header: PERMISSION_MESSAGE.COLUMN_PERMISSION,
	cell: (context): ReactElement => (
		<span className="flex flex-col">
			<span className="font-medium">
				{PERMISSION_LABEL[context.getValue()]}
			</span>
			<code className="text-xs text-muted-foreground">
				{context.getValue()}
			</code>
		</span>
	),
});

const roleColumn = (
	role: TRoleDto,
): DisplayColumnDef<TTableFeatures, TPermissionRow, unknown> =>
	helper.display({
		id: role.key,
		header: role.label,
		meta: { className: "text-center" },
		cell: (context): ReactElement =>
			A.includes(role.permissions, context.row.original.permission) ? (
				<Check
					className="mx-auto size-4"
					aria-label={PERMISSION_MESSAGE.GRANTED}
				/>
			) : (
				<span className="sr-only">{PERMISSION_MESSAGE.NOT_GRANTED}</span>
			),
	});

export const usePermissionTable = (): ReactTable<
	TTableFeatures,
	TPermissionRow
> => {
	const { data } = useRoleList();
	const columns = helper.columns([
		permissionColumn,
		...A.map(data.items, roleColumn),
	]);

	return useTable({
		features: TABLE_FEATURES,
		enableSorting: false,
		columns,
		data: ROWS,
		getRowId,
	});
};
