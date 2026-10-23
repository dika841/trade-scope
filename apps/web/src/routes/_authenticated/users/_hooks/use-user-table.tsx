import { formatDateTime } from "@app/format";
import { USER_MESSAGE } from "@app/messages";
import {
	USER_SORT,
	type TSortDirection,
	type TUser,
	type TUserList,
	type TUserSort,
	type TUserUpdateInput,
} from "@app/schemas";
import { createColumnHelper, type ReactTable } from "@tanstack/react-table";
import { type ReactElement, useMemo } from "react";
import type { TTableFeatures } from "#/libs/table/features.ts";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { useServerTable } from "#/routes/_authenticated/_hooks/use-server-table.ts";
import {
	type TConfirmedAction,
	useConfirmedAction,
} from "#/routes/_authenticated/_hooks/use-confirmed-action.ts";
import { UserActionsCell } from "#/routes/_authenticated/users/_components/user-actions-cell.tsx";
import { UserRoleCell } from "#/routes/_authenticated/users/_components/user-role-cell.tsx";
import type { TRoleOption } from "#/routes/_authenticated/users/_hooks/use-role-options.ts";
import {
	useIsSelf,
	useUserUpdate,
} from "#/routes/_authenticated/users/_hooks/use-users.ts";

const helper = createColumnHelper<TTableFeatures, TUser>();

const getRowId = (user: TUser): string => user.id;

const SORT_KEYS: readonly TUserSort[] = [
	USER_SORT.NAME,
	USER_SORT.EMAIL,
	USER_SORT.ROLE,
	USER_SORT.CREATED_AT,
];

export type TUserTableInput = {
	list: TUserList;
	roleOptions: readonly TRoleOption[];
	sortBy: TUserSort;
	sortDir: TSortDirection;
	onChange: TListChange<TUserSort>;
};

export type TUserTable = {
	table: ReactTable<TTableFeatures, TUser>;
	roleChange: TConfirmedAction<TUserUpdateInput>;
};

export const useUserTable = (input: TUserTableInput): TUserTable => {
	const { roleOptions } = input;
	const userUpdate = useUserUpdate();
	const isSelf = useIsSelf();
	const roleChange = useConfirmedAction<TUserUpdateInput>((input) =>
		userUpdate.mutate(input),
	);

	const columns = useMemo(
		() =>
			helper.columns([
				helper.accessor("name", {
					header: USER_MESSAGE.COLUMN_NAME,
					meta: { className: "font-medium" },
				}),
				helper.accessor("email", {
					header: USER_MESSAGE.COLUMN_EMAIL,
					meta: { className: "text-muted-foreground" },
				}),
				helper.accessor("role", {
					header: USER_MESSAGE.COLUMN_ROLE,
					cell: (context): ReactElement => (
						<UserRoleCell
							user={context.row.original}
							roleOptions={roleOptions}
							disabled={isSelf(context.row.original.id) || userUpdate.isPending}
							onChange={(role) =>
								roleChange.request({ id: context.row.original.id, role })
							}
						/>
					),
				}),
				helper.accessor("createdAt", {
					header: USER_MESSAGE.COLUMN_CREATED,
					meta: { className: "text-muted-foreground" },
					cell: (context): string => formatDateTime(context.getValue()),
				}),
				helper.display({
					id: "actions",
					header: USER_MESSAGE.COLUMN_ACTIONS,
					enableHiding: false,
					meta: { className: "text-right" },
					cell: (context): ReactElement => (
						<UserActionsCell
							user={context.row.original}
							isSelf={isSelf(context.row.original.id)}
						/>
					),
				}),
			]),
		[roleOptions, isSelf, userUpdate.isPending, roleChange.request],
	);

	const table = useServerTable({
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

	return { table, roleChange };
};
