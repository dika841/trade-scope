import { CATALOG_MESSAGE } from "@app/messages";
import { expect, test } from "@playwright/test";

test("searches for a product from the landing page and opens its detail", async ({
	page,
}): Promise<void> => {
	await page.goto("/");

	await expect(
		page.getByRole("heading", { name: CATALOG_MESSAGE.LANDING_TITLE }),
	).toBeVisible();

	await page.getByRole("searchbox").fill("coffee");
	await page
		.getByRole("button", { name: CATALOG_MESSAGE.SEARCH_ACTION })
		.click();

	await expect(page).toHaveURL(/\/search\?q=coffee/);
	await expect(
		page.getByRole("heading", { name: CATALOG_MESSAGE.RESULTS_TITLE }),
	).toBeVisible();
	await expect(page.getByText(CATALOG_MESSAGE.AMBIGUOUS)).toBeVisible();

	await page.getByRole("link", { name: /Coffee, roasted/ }).click();

	await expect(page).toHaveURL(/\/products\/090121\?revision=HS2022/);
	await expect(
		page.getByText("Coffee, roasted, not decaffeinated"),
	).toBeVisible();
	await expect(page.getByText("roasted coffee")).toBeVisible();
});

test("keeps the public search available without a session", async ({
	page,
}): Promise<void> => {
	await page.goto("/search?q=t-shirt");

	await expect(page).toHaveURL(/\/search\?q=t-shirt/);
	await expect(
		page.getByRole("heading", { name: CATALOG_MESSAGE.RESULTS_TITLE }),
	).toBeVisible();
	await expect(page.getByText("T-shirts")).toBeVisible();
});
