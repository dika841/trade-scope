import { USER_MESSAGE } from "@app/messages";
import type { FC, ReactElement } from "react";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";
import { DataTable } from "#/routes/_authenticated/_components/data-table.tsx";
import { UserSearch } from "#/routes/_authenticated/users/_components/user-search.tsx";
import {
	type TUserTableInput,
	useUserTable,
} from "#/routes/_authenticated/users/_hooks/use-user-table.tsx";

export const UserTable: FC<TUserTableInput> = (props): ReactElement => {
	const { table, roleChange } = useUserTable(props);

	return (
		<>
			<DataTable
				table={table}
				emptyMessage={USER_MESSAGE.EMPTY}
				toolbar={<UserSearch />}
				paginated
			/>
			<ConfirmDialog
				open={roleChange.open}
				title={USER_MESSAGE.ROLE_CHANGE_CONFIRM_TITLE}
				description={USER_MESSAGE.ROLE_CHANGE_CONFIRM_DESCRIPTION}
				onOpenChange={roleChange.onOpenChange}
				onConfirm={roleChange.onConfirm}
			/>
		</>
	);
};
