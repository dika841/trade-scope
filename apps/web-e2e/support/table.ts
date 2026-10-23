import type { Locator, Page } from "@playwright/test";

export const rowWithCell = (page: Page, cellText: string): Locator =>
	page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name: cellText, exact: true }) });
