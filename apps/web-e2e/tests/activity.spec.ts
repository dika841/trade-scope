import { ACTIVITY_ACTION } from "@app/activity";
import {
	ACTIVITY_ACTION_LABEL,
	ERROR_MESSAGE,
	ROLE_LABEL,
} from "@app/messages";
import { ROLE } from "@app/permissions";
import { expect, type Page, test } from "@playwright/test";
import { SEED_CREDENTIALS } from "../support/credentials.ts";
import { expectNavHidden, NAV_LABEL } from "../support/nav.ts";
import { selectOption } from "../support/select.ts";
import { signIn } from "../support/sign-in.ts";
import { signOut } from "../support/sign-out.ts";
import { createUser } from "../support/users.ts";

const AUDITED_USER = {
	name: "Audited User",
	email: "audited-e2e@test.app",
	password: "Password123!",
	role: ROLE.ANALYST,
};

test.describe.configure({ mode: "serial" });

test.describe("activity log", () => {
	let page: Page;

	test.beforeAll(async ({ browser }): Promise<void> => {
		page = await browser.newPage();
		await signIn(page, SEED_CREDENTIALS.admin);
	});

	test.afterAll(async (): Promise<void> => {
		await page.close();
	});

	test("records a user creation attributed to the admin", async (): Promise<void> => {
		await createUser(page, AUDITED_USER, ROLE_LABEL.analyst);

		await page.goto("/activity");
		await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();

		await selectOption(
			page,
			page.getByLabel("Action", { exact: true }),
			ACTIVITY_ACTION_LABEL[ACTIVITY_ACTION.USER_CREATE],
		);
		await expect(page).toHaveURL(/action=user\.create/);

		const entry = page
			.getByRole("row")
			.filter({ hasText: SEED_CREDENTIALS.admin.email })
			.filter({ hasText: ACTIVITY_ACTION_LABEL[ACTIVITY_ACTION.USER_CREATE] })
			.first();
		await expect(entry).toBeVisible();
	});

	test("is hidden from a viewer", async (): Promise<void> => {
		await signOut(page);
		await signIn(page, SEED_CREDENTIALS.viewer);

		await expectNavHidden(page, [NAV_LABEL.ACTIVITY]);

		await page.goto("/activity");
		await expect(
			page.getByRole("heading", { name: ERROR_MESSAGE.FORBIDDEN_TITLE }),
		).toBeVisible();
		await expect(page).toHaveURL(/\/activity/);
	});
});
