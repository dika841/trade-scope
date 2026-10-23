import { expect, type Page } from "@playwright/test";

export const signOut = async (page: Page): Promise<void> => {
	await page
		.locator('[data-sidebar="footer"] [data-sidebar="menu-button"]')
		.click();
	await page.getByRole("menuitem", { name: "Sign out" }).click();
	await expect(page).toHaveURL(/\/login/);
};
