import { PermissionsProvider } from "@app/components/guard/permissions-provider";
import type { FC, ReactElement, ReactNode } from "react";
import { useSession } from "#/libs/auth/use-session.ts";

type TAppPermissionsProps = {
	children: ReactNode;
};

export const AppPermissions: FC<TAppPermissionsProps> = (
	props,
): ReactElement => {
	const session = useSession();

	return (
		<PermissionsProvider permissions={session?.permissions ?? []}>
			{props.children}
		</PermissionsProvider>
	);
};
