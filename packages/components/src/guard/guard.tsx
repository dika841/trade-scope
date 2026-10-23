import type { TPermission } from "@app/permissions";
import type { FC, ReactElement, ReactNode } from "react";
import { match } from "ts-pattern";
import { usePermissions } from "./use-permissions.ts";

export const GUARD_MODE = {
	ALL: "all",
	ANY: "any",
} as const;

export type TGuardMode = (typeof GUARD_MODE)[keyof typeof GUARD_MODE];

type TGuardProps = {
	permissions: readonly TPermission[];
	mode?: TGuardMode;
	fallback?: ReactNode;
	children: ReactNode;
};

export const Guard: FC<TGuardProps> = (props): ReactElement => {
	const {
		permissions,
		mode = GUARD_MODE.ALL,
		fallback = null,
		children,
	} = props;

	const { canAll, canAny } = usePermissions();

	const allowed = match(mode)
		.with(GUARD_MODE.ALL, () => canAll(permissions))
		.with(GUARD_MODE.ANY, () => canAny(permissions))
		.exhaustive();

	return (
		<>
			{match(allowed)
				.with(true, () => children)
				.otherwise(() => fallback)}
		</>
	);
};
