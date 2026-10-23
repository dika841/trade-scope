import { ROLE_MESSAGE } from "@app/messages";
import type { TRoleCreateInput, TUserCreateInput } from "@app/schemas";
import { expect, type Page, test } from "@playwright/test";
import {
	FIXED_ROLE_KEYS,
	PERMISSION_KEY,
	PERMISSION_LABEL,
	ROLE_KEY,
} from "../support/access.ts";
import { SEED_CREDENTIALS } from "../support/credentials.ts";
import { expectNavVisible, NAV_LABEL } from "../support/nav.ts";
import { signIn } from "../support/sign-in.ts";
import { signOut } from "../support/sign-out.ts";
import { rowWithCell } from "../support/table.ts";
import { confirmAction } from "../support/confirm.ts";
import { createUser } from "../support/users.ts";

const FIXED_NOTICE = ROLE_MESSAGE.FIXED;

const NEW_ROLE: TRoleCreateInput = {
	key: "e2e-reviewer",
	label: "Reviewer",
	description: "Audits activity, nothing else.",
	permissions: [PERMISSION_KEY.ACTIVITY_READ],
};
const RENAMED_LABEL = "Reviewer Plus";

const REVIEWER: TUserCreateInput = {
	name: "E2E Reviewer",
	email: "e2e-reviewer@test.app",
	password: "rePassword123",
	role: NEW_ROLE.key,
};

test.describe.configure({ mode: "serial" });

test.describe("roles admin flow", () => {
	let page: Page;

	test.beforeAll(async ({ browser }): Promise<void> => {
		page = await browser.newPage();
		await signIn(page, SEED_CREDENTIALS.admin);
	});

	test.afterAll(async (): Promise<void> => {
		await page.close();
	});

	test("marks the fixed roles and keeps their edit page read-only", async (): Promise<void> => {
		await page.goto("/roles");
		await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();

		await Promise.all(
			FIXED_ROLE_KEYS.map((key) =>
				expect(rowWithCell(page, key).getByText("Fixed")).toBeVisible(),
			),
		);

		await rowWithCell(page, ROLE_KEY.ADMIN)
			.getByRole("link", { name: "View" })
			.click();
		await expect(page).toHaveURL(new RegExp(`/roles/${ROLE_KEY.ADMIN}$`));

		await expect(page.getByText(FIXED_NOTICE)).toBeVisible();
		await expect(page.getByLabel("Label", { exact: true })).toBeDisabled();
		await expect(page.getByRole("checkbox").first()).toBeDisabled();
		await expect(
			page.getByRole("button", { name: ROLE_MESSAGE.SAVE_CHANGES }),
		).toHaveCount(0);
	});

	test("creates a custom role with a single permission", async (): Promise<void> => {
		await page.goto("/roles");

		await page.getByLabel("Key", { exact: true }).fill(NEW_ROLE.key);
		await page.getByLabel("Label", { exact: true }).fill(NEW_ROLE.label);
		await page
			.getByLabel("Description", { exact: true })
			.fill(NEW_ROLE.description ?? "");
		await page
			.getByRole("checkbox", {
				name: PERMISSION_LABEL[PERMISSION_KEY.ACTIVITY_READ],
			})
			.check();
		await page
			.getByRole("button", { name: ROLE_MESSAGE.CREATE_ACTION })
			.click();
		await confirmAction(page);

		const row = rowWithCell(page, NEW_ROLE.key);
		await expect(row).toContainText(NEW_ROLE.label);
		await expect(row.getByText("Fixed")).toHaveCount(0);
		await expect(
			row.getByRole("cell", { name: "1", exact: true }),
		).toBeVisible();
	});

	test("edits the custom role's label and grants user:manage", async (): Promise<void> => {
		await rowWithCell(page, NEW_ROLE.key)
			.getByRole("link", { name: "Edit" })
			.click();
		await expect(page).toHaveURL(new RegExp(`/roles/${NEW_ROLE.key}$`));
		await expect(
			page.getByRole("heading", { name: NEW_ROLE.label }),
		).toBeVisible();
		await expect(page.getByText(FIXED_NOTICE)).toHaveCount(0);

		await page.getByLabel("Label", { exact: true }).fill(RENAMED_LABEL);
		await page
			.getByRole("checkbox", {
				name: PERMISSION_LABEL[PERMISSION_KEY.USER_MANAGE],
			})
			.check();
		await page.getByRole("button", { name: ROLE_MESSAGE.SAVE_CHANGES }).click();
		await confirmAction(page);

		await expect(page).toHaveURL(/\/roles$/);
		const row = rowWithCell(page, NEW_ROLE.key);
		await expect(row).toContainText(RENAMED_LABEL);
		await expect(
			row.getByRole("cell", { name: "2", exact: true }),
		).toBeVisible();
	});

	test("assigns the custom role to a new user", async (): Promise<void> => {
		await createUser(page, REVIEWER, RENAMED_LABEL);

		await expect(page.getByLabel(`Role for ${REVIEWER.name}`)).toHaveText(
			RENAMED_LABEL,
		);
	});

	test("the reviewer gets exactly the custom role's permissions", async (): Promise<void> => {
		await signOut(page);
		await signIn(page, { email: REVIEWER.email, password: REVIEWER.password });

		await expectNavVisible(page, [
			NAV_LABEL.DASHBOARD,
			NAV_LABEL.USERS,
			NAV_LABEL.ROLES,
			NAV_LABEL.PERMISSIONS,
			NAV_LABEL.ACTIVITY,
			NAV_LABEL.ACCOUNT,
		]);

		await page.goto("/roles");
		await expect(
			page.getByRole("heading", { name: ROLE_MESSAGE.TITLE }),
		).toBeVisible();
		await expect(page).toHaveURL(/\/roles/);
	});
});
