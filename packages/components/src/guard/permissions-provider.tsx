import type { TPermission } from "@app/permissions";
import {
	createContext,
	type FC,
	type ReactElement,
	type ReactNode,
	useContext,
} from "react";

const NO_PERMISSIONS: readonly TPermission[] = [];

const PermissionsContext =
	createContext<readonly TPermission[]>(NO_PERMISSIONS);

type TPermissionsProviderProps = {
	permissions: readonly TPermission[];
	children: ReactNode;
};

export const PermissionsProvider: FC<TPermissionsProviderProps> = (
	props,
): ReactElement => (
	<PermissionsContext.Provider value={props.permissions}>
		{props.children}
	</PermissionsContext.Provider>
);

export const useGrantedPermissions = (): readonly TPermission[] =>
	useContext(PermissionsContext);
