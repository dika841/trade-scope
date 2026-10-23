import { Guard } from "@app/components/guard/guard";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { PERMISSION } from "@app/permissions";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { RoleEditForm } from "#/routes/_authenticated/roles/_components/role-edit-form.tsx";
import {
	roleGetOptions,
	useRoleGet,
} from "#/routes/_authenticated/roles/_hooks/use-roles.ts";

const RoleEditPage: FC = (): ReactElement => {
	const { data } = useRoleGet();

	return (
		<div className="flex max-w-3xl flex-col gap-6">
			<h1 className="text-xl font-semibold">{data.label}</h1>
			<Guard permissions={[PERMISSION.USER_MANAGE]}>
				<RoleEditForm key={data.key} role={data} />
			</Guard>
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/roles/$key")({
	beforeLoad: checkRoutePermissions({ permissions: [PERMISSION.USER_MANAGE] }),
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(roleGetOptions(params.key)),
	component: RoleEditPage,
});
