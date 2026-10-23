import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { USER_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { FormPage } from "#/routes/_authenticated/_components/form-page.tsx";
import { roleListOptions } from "#/routes/_authenticated/roles/_hooks/use-roles.ts";
import { UserCreateForm } from "#/routes/_authenticated/users/_components/user-create-form.tsx";
import { useRoleOptions } from "#/routes/_authenticated/users/_hooks/use-role-options.ts";

const UserCreatePage: FC = (): ReactElement => {
	const roleOptions = useRoleOptions();

	return (
		<FormPage
			parentLabel={USER_MESSAGE.TITLE}
			parentTo="/users"
			backLabel={USER_MESSAGE.BACK_TO_USERS}
			title={USER_MESSAGE.NEW_USER}
			description={USER_MESSAGE.CREATE_DESCRIPTION}
		>
			<UserCreateForm roleOptions={roleOptions} />
		</FormPage>
	);
};

export const Route = createFileRoute("/_authenticated/users/create")({
	beforeLoad: checkRoutePermissions({ permissions: [PERMISSION.USER_MANAGE] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(roleListOptions()),
	component: UserCreatePage,
});
