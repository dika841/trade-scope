import { Guard } from "@app/components/guard/guard";
import { USER_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import type { TUser } from "@app/schemas";
import { Link } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { DeleteConfirm } from "#/routes/_authenticated/_components/delete-confirm.tsx";
import { useUserDelete } from "#/routes/_authenticated/users/_hooks/use-users.ts";

type TUserActionsCellProps = {
	user: TUser;
	isSelf: boolean;
};

export const UserActionsCell: FC<TUserActionsCellProps> = (
	props,
): ReactElement => {
	const userDelete = useUserDelete();

	return (
		<>
			<Link
				to="/users/$userId"
				params={{ userId: props.user.id }}
				className="px-3 py-1 text-sm hover:underline"
			>
				{USER_MESSAGE.ACTION_EDIT}
			</Link>
			<Guard permissions={[PERMISSION.USER_MANAGE]}>
				<DeleteConfirm
					title={USER_MESSAGE.DELETE_CONFIRM_TITLE}
					description={USER_MESSAGE.DELETE_CONFIRM_DESCRIPTION}
					disabled={props.isSelf || userDelete.isPending}
					onConfirm={() => userDelete.mutate({ id: props.user.id })}
				/>
			</Guard>
		</>
	);
};
