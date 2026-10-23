import { PERMISSION } from "@app/permissions";
import { describe, expect, it } from "vitest";
import { EForbidden } from "#/libs/auth/forbidden.ts";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";

const guard = checkRoutePermissions({
	permissions: [PERMISSION.USER_MANAGE],
});

describe("checkRoutePermissions", () => {
	it("lets a visitor with every required permission through", (): void => {
		expect(
			guard({ context: { permissions: [PERMISSION.USER_MANAGE] } }),
		).toBeUndefined();
	});

	it("refuses a visitor without them by raising a forbidden error, not a redirect", (): void => {
		expect(() =>
			guard({ context: { permissions: [PERMISSION.ACTIVITY_READ] } }),
		).toThrow(EForbidden);
	});
});
