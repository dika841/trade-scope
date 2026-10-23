import { PERMISSION_MESSAGE } from "@app/messages";
import type { FC, ReactElement } from "react";
import { DataTable } from "#/routes/_authenticated/_components/data-table.tsx";
import { usePermissionTable } from "#/routes/_authenticated/permissions/_hooks/use-permission-table.tsx";

export const PermissionMatrix: FC = (): ReactElement => {
	const table = usePermissionTable();

	return <DataTable table={table} emptyMessage={PERMISSION_MESSAGE.EMPTY} />;
};
