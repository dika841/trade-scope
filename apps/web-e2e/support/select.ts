import type { Locator, Page } from "@playwright/test";

export const selectOption = async (
	page: Page,
	trigger: Locator,
	optionLabel: string,
): Promise<void> => {
	await trigger.click();
	await page.getByRole("option", { name: optionLabel, exact: true }).click();
};
