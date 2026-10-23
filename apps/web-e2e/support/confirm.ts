import type { Page } from "@playwright/test";

export const confirmAction = async (page: Page): Promise<void> => {
	await page.getByRole("button", { name: "Confirm" }).click();
};
