import { PERMISSION } from "@app/permissions";
import type { TPermissionList } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { apiFetch, apiJson } from "../support/api-fetch.ts";
import { SEED_CREDENTIALS, signIn } from "../support/sign-in.ts";

describe("permissions REST endpoint", () => {
	it("lists the permission catalog for an admin", async (): Promise<void> => {
		const adminCookie = await signIn(SEED_CREDENTIALS.admin);
		const list = await apiJson<TPermissionList>({
			path: "/permissions",
			cookie: adminCookie,
		});
		expect(
			A.some(list.items, (item) => item.key === PERMISSION.USER_MANAGE),
		).toBe(true);
	});

	it("is forbidden for a viewer", async (): Promise<void> => {
		const viewerCookie = await signIn(SEED_CREDENTIALS.viewer);
		const response = await apiFetch({
			path: "/permissions",
			cookie: viewerCookie,
		});
		expect(response.status).toBe(403);
	});
});
