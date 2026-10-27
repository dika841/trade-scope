import { PILOT_MESSAGE } from "@app/messages";
import { expect, type Page, test } from "@playwright/test";
import { confirmAction } from "../support/confirm.ts";
import { SEED_CREDENTIALS } from "../support/credentials.ts";
import { selectOption } from "../support/select.ts";
import { signIn } from "../support/sign-in.ts";

test.describe.configure({ mode: "serial" });

test.describe("pilot admin flow", () => {
	let page: Page;

	test.beforeAll(async ({ browser }): Promise<void> => {
		page = await browser.newPage();
		await signIn(page, SEED_CREDENTIALS.admin);
	});

	test.afterAll(async (): Promise<void> => {
		await page.close();
	});

	test("creates a pilot and moves it into review", async (): Promise<void> => {
		await page.goto("/pilots");
		await expect(
			page.getByRole("heading", { name: PILOT_MESSAGE.TITLE }),
		).toBeVisible();

		await page.getByRole("link", { name: PILOT_MESSAGE.NEW_PILOT }).click();
		await expect(page).toHaveURL(/\/pilots\/new$/);

		await page.getByLabel(PILOT_MESSAGE.FIELD_PRODUCT).fill("coffee");
		await page
			.getByRole("button", { name: /Coffee, roasted/ })
			.first()
			.click();

		await selectOption(
			page,
			page.getByLabel(PILOT_MESSAGE.FIELD_MARKET),
			"United States (US)",
		);
		await page
			.getByLabel(PILOT_MESSAGE.FIELD_NOTES)
			.fill("Web E2E pilot request");
		await page
			.getByRole("button", { name: PILOT_MESSAGE.CREATE_ACTION })
			.click();
		await confirmAction(page);

		await expect(page).toHaveURL(/\/pilots\/[0-9a-f-]+$/);
		await expect(page.locator('[data-slot="badge"]')).toHaveText(
			PILOT_MESSAGE.STATUS_NEW,
		);
		await expect(
			page.getByRole("textbox", { name: PILOT_MESSAGE.FIELD_NOTES }),
		).toHaveValue("Web E2E pilot request");

		await selectOption(
			page,
			page.getByLabel(PILOT_MESSAGE.FIELD_STATUS),
			PILOT_MESSAGE.STATUS_IN_REVIEW,
		);
		await page
			.getByRole("button", { name: PILOT_MESSAGE.SAVE_CHANGES })
			.click();
		await confirmAction(page);

		await expect(page.locator('[data-slot="badge"]')).toHaveText(
			PILOT_MESSAGE.STATUS_IN_REVIEW,
		);
	});

	test("keeps the list read-only for a viewer", async ({
		browser,
	}): Promise<void> => {
		const viewer = await browser.newPage();
		await signIn(viewer, SEED_CREDENTIALS.viewer);
		await viewer.goto("/pilots");

		await expect(
			viewer.getByRole("heading", { name: PILOT_MESSAGE.TITLE }),
		).toBeVisible();
		await expect(
			viewer.getByRole("link", { name: PILOT_MESSAGE.NEW_PILOT }),
		).toHaveCount(0);

		await viewer.close();
	});
});
