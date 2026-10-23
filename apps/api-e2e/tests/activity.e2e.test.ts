import { ROLE } from "@app/permissions";
import type { TActivityList, TUser } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { beforeAll, describe, expect, it } from "vitest";
import { apiFetch, apiJson } from "../support/api-fetch.ts";
import { SEED_CREDENTIALS, signIn } from "../support/sign-in.ts";

const USER_CREATE_ACTION = "user.create";

let adminCookie = "";

beforeAll(async (): Promise<void> => {
	adminCookie = await signIn(SEED_CREDENTIALS.admin);
});

describe("activity REST endpoint", () => {
	it("records a user creation with the acting admin as actor", async (): Promise<void> => {
		const createdUser = await apiJson<TUser>({
			path: "/users",
			cookie: adminCookie,
			method: "POST",
			body: {
				name: "Audited User",
				email: "audited-user@test.app",
				password: "password-12345",
				role: ROLE.ANALYST,
			},
		});

		const list = await apiJson<TActivityList>({
			path: `/activity?page=1&pageSize=20&action=${USER_CREATE_ACTION}`,
			cookie: adminCookie,
		});
		const entry = A.find(
			list.items,
			(item) => item.resourceId === createdUser.id,
		);

		expect(entry?.action).toBe(USER_CREATE_ACTION);
		expect(entry?.actorEmail).toBe(SEED_CREDENTIALS.admin.email);

		await apiFetch({
			path: `/users/${createdUser.id}`,
			cookie: adminCookie,
			method: "DELETE",
		});
	});

	it("is forbidden for a viewer", async (): Promise<void> => {
		const viewerCookie = await signIn(SEED_CREDENTIALS.viewer);
		const response = await apiFetch({
			path: "/activity?page=1&pageSize=20",
			cookie: viewerCookie,
		});
		expect(response.status).toBe(403);
	});
});
