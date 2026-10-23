import { Guard } from "@app/components/guard/guard";
import { ROLE_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import type { TRoleDto } from "@app/schemas";
import { Link } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { DeleteConfirm } from "#/routes/_authenticated/_components/delete-confirm.tsx";
import { useRoleDelete } from "#/routes/_authenticated/roles/_hooks/use-roles.ts";
import { roleDeletable } from "#/routes/_authenticated/roles/_utils/role-deletable.ts";

type TRoleActionsCellProps = {
	role: TRoleDto;
};

export const RoleActionsCell: FC<TRoleActionsCellProps> = (
	props,
): ReactElement => {
	const roleDelete = useRoleDelete();

	return (
		<>
			<Link
				to="/roles/$key"
				params={{ key: props.role.key }}
				className="px-3 py-1 text-sm hover:underline"
			>
				{props.role.fixed ? ROLE_MESSAGE.ACTION_VIEW : ROLE_MESSAGE.ACTION_EDIT}
			</Link>
			{roleDeletable(props.role) && (
				<Guard permissions={[PERMISSION.USER_MANAGE]}>
					<DeleteConfirm
						title={ROLE_MESSAGE.DELETE_CONFIRM_TITLE}
						description={ROLE_MESSAGE.DELETE_CONFIRM_DESCRIPTION}
						disabled={roleDelete.isPending}
						onConfirm={() => roleDelete.mutate({ key: props.role.key })}
					/>
				</Guard>
			)}
		</>
	);
};
