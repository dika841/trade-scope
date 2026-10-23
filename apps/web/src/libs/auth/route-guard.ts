import { canAll, type TPermission } from "@app/permissions";
import { match } from "ts-pattern";
import { EForbidden } from "#/libs/auth/forbidden.ts";

type TRouteContext = {
	permissions: readonly TPermission[];
};

type TRouteGuardInput = {
	context: TRouteContext;
};

type TCheckRoutePermissionsOptions = {
	permissions: readonly TPermission[];
};

export const checkRoutePermissions =
	(
		options: TCheckRoutePermissionsOptions,
	): ((input: TRouteGuardInput) => void) =>
	(input): void => {
		match(canAll(input.context.permissions, options.permissions))
			.with(false, (): never => {
				throw new EForbidden();
			})
			.otherwise((): undefined => undefined);
	};
