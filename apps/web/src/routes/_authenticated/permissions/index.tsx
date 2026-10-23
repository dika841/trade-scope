import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { PERMISSION_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { PermissionMatrix } from "#/routes/_authenticated/permissions/_components/permission-matrix.tsx";
import { roleListOptions } from "#/routes/_authenticated/roles/_hooks/use-roles.ts";

const PermissionsPage: FC = (): ReactElement => {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-semibold">{PERMISSION_MESSAGE.TITLE}</h1>
				<p className="text-sm text-muted-foreground">
					{PERMISSION_MESSAGE.DESCRIPTION}
				</p>
			</div>
			<PermissionMatrix />
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/permissions/")({
	beforeLoad: checkRoutePermissions({ permissions: [PERMISSION.USER_MANAGE] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(roleListOptions()),
	component: PermissionsPage,
});
