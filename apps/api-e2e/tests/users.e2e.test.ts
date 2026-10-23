import { ROLE } from "@app/permissions";
import type { TMe, TUser, TUserCreateInput, TUserList } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { beforeAll, describe, expect, it } from "vitest";
import { apiFetch, apiJson } from "../support/api-fetch.ts";
import { SEED_CREDENTIALS, signIn } from "../support/sign-in.ts";

const NEW_USER: TUserCreateInput = {
	name: "E2E User",
	email: "e2e-user@test.app",
	password: "e2e-password-123",
	role: ROLE.ANALYST,
};

let adminCookie = "";
let adminId = "";

beforeAll(async (): Promise<void> => {
	adminCookie = await signIn(SEED_CREDENTIALS.admin);
	const me = await apiJson<TMe>({ path: "/me", cookie: adminCookie });
	adminId = me.user.id;
});

describe("users REST endpoints", () => {
	it("creates, lists, updates, and deletes a user as the seeded admin", async (): Promise<void> => {
		const createResponse = await apiFetch({
			path: "/users",
			cookie: adminCookie,
			method: "POST",
			body: NEW_USER,
		});
		expect(createResponse.status).toBe(200);
		const created = (await createResponse.json()) as TUser;
		expect(created.email).toBe(NEW_USER.email);
		expect(created.role).toBe(ROLE.ANALYST);

		const list = await apiJson<TUserList>({
			path: "/users?page=1&pageSize=50",
			cookie: adminCookie,
		});
		expect(A.some(list.items, (item) => item.id === created.id)).toBe(true);

		const updateResponse = await apiFetch({
			path: `/users/${created.id}`,
			cookie: adminCookie,
			method: "PATCH",
			body: { name: "E2E Renamed", role: ROLE.VIEWER },
		});
		expect(updateResponse.status).toBe(200);
		const updated = (await updateResponse.json()) as TUser;
		expect(updated.name).toBe("E2E Renamed");
		expect(updated.role).toBe(ROLE.VIEWER);

		const userCookie = await signIn({
			email: NEW_USER.email,
			password: NEW_USER.password,
		});
		const me = await apiJson<TMe>({ path: "/me", cookie: userCookie });
		expect(me.user.role).toBe(ROLE.VIEWER);

		const deleteResponse = await apiFetch({
			path: `/users/${created.id}`,
			cookie: adminCookie,
			method: "DELETE",
		});
		expect(deleteResponse.status).toBe(200);
	});

	it("lets the admin reset another user's password", async (): Promise<void> => {
		const target: TUserCreateInput = {
			name: "E2E Reset",
			email: "e2e-reset@test.app",
			password: "old-password-123",
			role: ROLE.VIEWER,
		};
		const created = await apiJson<TUser>({
			path: "/users",
			cookie: adminCookie,
			method: "POST",
			body: target,
		});

		const reset = await apiFetch({
			path: `/users/${created.id}/password`,
			cookie: adminCookie,
			method: "POST",
			body: { password: "new-password-456" },
		});
		expect(reset.status).toBe(200);

		const oldCookie = await signIn({
			email: target.email,
			password: target.password,
		});
		expect(oldCookie).toBe("");

		const newCookie = await signIn({
			email: target.email,
			password: "new-password-456",
		});
		const me = await apiJson<TMe>({ path: "/me", cookie: newCookie });
		expect(me.user.id).toBe(created.id);

		const cleanup = await apiFetch({
			path: `/users/${created.id}`,
			cookie: adminCookie,
			method: "DELETE",
		});
		expect(cleanup.status).toBe(200);
	});

	it("refuses to let the admin delete their own account", async (): Promise<void> => {
		const response = await apiFetch({
			path: `/users/${adminId}`,
			cookie: adminCookie,
			method: "DELETE",
		});
		expect(response.status).toBe(403);
	});

	it("rejects an unknown role and a duplicate email", async (): Promise<void> => {
		const unknownRole = await apiFetch({
			path: "/users",
			cookie: adminCookie,
			method: "POST",
			body: { ...NEW_USER, email: "ghost@test.app", role: "ghost" },
		});
		expect(unknownRole.status).toBe(400);

		const duplicate = await apiFetch({
			path: "/users",
			cookie: adminCookie,
			method: "POST",
			body: { ...NEW_USER, email: SEED_CREDENTIALS.admin.email },
		});
		expect(duplicate.status).toBe(409);
	});

	it("is forbidden for an analyst", async (): Promise<void> => {
		const analystCookie = await signIn(SEED_CREDENTIALS.analyst);
		const response = await apiFetch({
			path: "/users?page=1&pageSize=20",
			cookie: analystCookie,
		});
		expect(response.status).toBe(403);
	});
});
