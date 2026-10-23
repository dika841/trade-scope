import { Guard } from "@app/components/guard/guard";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { formatDateTime } from "@app/format";
import { USER_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { FormPage } from "#/routes/_authenticated/_components/form-page.tsx";
import { roleListOptions } from "#/routes/_authenticated/roles/_hooks/use-roles.ts";
import { UserEditForm } from "#/routes/_authenticated/users/_components/user-edit-form.tsx";
import { UserPasswordResetForm } from "#/routes/_authenticated/users/_components/user-password-reset-form.tsx";
import { useRoleOptions } from "#/routes/_authenticated/users/_hooks/use-role-options.ts";
import {
	userGetOptions,
	useIsSelf,
	useUserGet,
} from "#/routes/_authenticated/users/_hooks/use-users.ts";

const UserEditPage: FC = (): ReactElement => {
	const { data } = useUserGet();
	const roleOptions = useRoleOptions();
	const isSelf = useIsSelf();

	return (
		<FormPage
			parentLabel={USER_MESSAGE.TITLE}
			parentTo="/users"
			backLabel={USER_MESSAGE.BACK_TO_USERS}
			title={USER_MESSAGE.EDIT_USER}
			description={USER_MESSAGE.EDIT_DESCRIPTION}
			meta={
				<dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
					<div className="flex gap-1">
						<dt>{USER_MESSAGE.COLUMN_EMAIL}</dt>
						<dd>{data.email}</dd>
					</div>
					<div className="flex gap-1">
						<dt>{USER_MESSAGE.COLUMN_CREATED}</dt>
						<dd>{formatDateTime(data.createdAt)}</dd>
					</div>
				</dl>
			}
		>
			<Guard permissions={[PERMISSION.USER_MANAGE]}>
				<UserEditForm user={data} roleOptions={roleOptions} />
			</Guard>
			{!isSelf(data.id) && (
				<Guard permissions={[PERMISSION.USER_MANAGE]}>
					<UserPasswordResetForm user={data} />
				</Guard>
			)}
		</FormPage>
	);
};

export const Route = createFileRoute("/_authenticated/users/$userId")({
	beforeLoad: checkRoutePermissions({ permissions: [PERMISSION.USER_MANAGE] }),
	loader: ({ context, params }) =>
		Promise.all([
			context.queryClient.ensureQueryData(userGetOptions(params.userId)),
			context.queryClient.ensureQueryData(roleListOptions()),
		]),
	component: UserEditPage,
});
