import { DASHBOARD_MESSAGE, REPORT_MESSAGE } from "@app/messages";
import { expect, type Page, test } from "@playwright/test";
import { confirmAction } from "../support/confirm.ts";
import { SEED_CREDENTIALS } from "../support/credentials.ts";
import { signIn } from "../support/sign-in.ts";

test.describe.configure({ mode: "serial" });

test.describe("report admin flow", () => {
	let page: Page;

	test.beforeAll(async ({ browser }): Promise<void> => {
		page = await browser.newPage();
		await signIn(page, SEED_CREDENTIALS.admin);
	});

	test.afterAll(async (): Promise<void> => {
		await page.close();
	});

	test("generates a report, shares it, and revokes the link", async ({
		browser,
	}): Promise<void> => {
		await page.goto("/dashboard");
		await expect(
			page.getByRole("main").getByText(DASHBOARD_MESSAGE.TOTAL_PILOTS),
		).toBeVisible();
		await expect(
			page.getByRole("main").getByText(DASHBOARD_MESSAGE.PILOTS_ATTENTION),
		).toBeVisible();
		await expect(
			page.getByRole("main").getByText(DASHBOARD_MESSAGE.TOTAL_REPORTS),
		).toBeVisible();

		await page.goto("/reports");
		await expect(
			page.getByRole("heading", { name: REPORT_MESSAGE.TITLE }),
		).toBeVisible();

		await page.getByRole("link", { name: REPORT_MESSAGE.NEW_REPORT }).click();
		await expect(page).toHaveURL(/\/reports\/new$/);

		await page.getByLabel(REPORT_MESSAGE.FIELD_PRODUCT).fill("coffee");
		await page
			.getByRole("button", { name: /Coffee, roasted/ })
			.first()
			.click();
		await page.getByLabel(REPORT_MESSAGE.FIELD_TITLE).fill("Web E2E report");
		await page
			.getByRole("button", { name: REPORT_MESSAGE.CREATE_ACTION })
			.click();
		await confirmAction(page);

		await expect(page).toHaveURL(/\/reports\/[0-9a-f-]+$/);
		await expect(page.getByText("Web E2E report").first()).toBeVisible();
		await expect(page.getByText("United States").first()).toBeVisible();

		const shareUrl = await page.locator("input[readonly]").first().inputValue();
		expect(shareUrl).toContain("/share/reports/");

		const shared = await browser.newPage();
		await shared.goto(shareUrl);
		await expect(shared.getByText("Web E2E report").first()).toBeVisible();
		await expect(shared.getByText("United States").first()).toBeVisible();

		await page
			.getByRole("button", { name: REPORT_MESSAGE.REVOKE_ACTION })
			.click();
		await confirmAction(page);
		await expect(page.locator('[data-slot="badge"]')).toHaveText(
			REPORT_MESSAGE.STATUS_REVOKED,
		);

		await shared.reload();
		await expect(
			shared.getByText(REPORT_MESSAGE.SHARED_NOT_FOUND_TITLE),
		).toBeVisible();

		await shared.close();
	});

	test("keeps the list read-only for a viewer", async ({
		browser,
	}): Promise<void> => {
		const viewer = await browser.newPage();
		await signIn(viewer, SEED_CREDENTIALS.viewer);
		await viewer.goto("/reports");

		await expect(
			viewer.getByRole("heading", { name: REPORT_MESSAGE.TITLE }),
		).toBeVisible();
		await expect(
			viewer.getByRole("link", { name: REPORT_MESSAGE.NEW_REPORT }),
		).toHaveCount(0);

		await viewer.close();
	});
});
