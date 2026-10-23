import { AUTH_MESSAGE } from "@app/messages";
import { expect, type Page, test } from "@playwright/test";
import { ROLE_KEY, ROLE_LABEL } from "../support/access.ts";
import { SEED_CREDENTIALS } from "../support/credentials.ts";
import { signIn, signInExpectingRejection } from "../support/sign-in.ts";
import { signOut } from "../support/sign-out.ts";
import { confirmAction } from "../support/confirm.ts";

const NEW_PASSWORD = "analyst-new-password-456";

test.describe.configure({ mode: "serial" });

test.describe("account self-service", () => {
	let page: Page;

	test.beforeAll(async ({ browser }): Promise<void> => {
		page = await browser.newPage();
		await signIn(page, SEED_CREDENTIALS.analyst);
	});

	test.afterAll(async (): Promise<void> => {
		await page.close();
	});

	test("shows the signed-in analyst's details", async (): Promise<void> => {
		await page.goto("/account");
		await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();

		const summary = page.getByRole("main").locator("dl");
		await expect(summary).toContainText(SEED_CREDENTIALS.analyst.email);
		await expect(summary).toContainText(ROLE_LABEL[ROLE_KEY.ANALYST]);
	});

	test("changes the password", async (): Promise<void> => {
		await page
			.getByLabel(AUTH_MESSAGE.FIELD_CURRENT_PASSWORD, { exact: true })
			.fill(SEED_CREDENTIALS.analyst.password);
		await page
			.getByLabel(AUTH_MESSAGE.FIELD_NEW_PASSWORD, { exact: true })
			.fill(NEW_PASSWORD);
		await page
			.getByLabel(AUTH_MESSAGE.FIELD_CONFIRM_PASSWORD, { exact: true })
			.fill(NEW_PASSWORD);
		await page
			.getByRole("button", { name: AUTH_MESSAGE.PASSWORD_UPDATE })
			.click();
		await confirmAction(page);

		await expect(page.getByText(AUTH_MESSAGE.PASSWORD_CHANGED)).toBeVisible();
	});

	test("rejects the old password and accepts the new one", async (): Promise<void> => {
		await signOut(page);

		await signInExpectingRejection(page, SEED_CREDENTIALS.analyst);
		await signIn(page, {
			email: SEED_CREDENTIALS.analyst.email,
			password: NEW_PASSWORD,
		});
	});
});
