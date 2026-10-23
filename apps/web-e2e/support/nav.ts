import { NAV_MESSAGE } from "@app/messages";
import { expect, type Locator, type Page } from "@playwright/test";

export const NAV_LABEL = NAV_MESSAGE;

export const ADMIN_NAV_LABELS: readonly string[] = [
	NAV_LABEL.USERS,
	NAV_LABEL.ROLES,
	NAV_LABEL.PERMISSIONS,
	NAV_LABEL.ACTIVITY,
];

const navLink = (page: Page, label: string): Locator =>
	page
		.locator('[data-sidebar="content"]')
		.getByRole("link", { name: label, exact: true });

export const expectNavVisible = async (
	page: Page,
	labels: readonly string[],
): Promise<void> => {
	await Promise.all(
		labels.map((label) => expect(navLink(page, label)).toBeVisible()),
	);
};

export const expectNavHidden = async (
	page: Page,
	labels: readonly string[],
): Promise<void> => {
	await Promise.all(
		labels.map((label) => expect(navLink(page, label)).toHaveCount(0)),
	);
};
