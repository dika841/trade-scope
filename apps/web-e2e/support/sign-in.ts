import { AUTH_MESSAGE } from "@app/messages";
import type { TLoginInput } from "@app/schemas";
import { expect, type Page } from "@playwright/test";

const submitLogin = async (
	page: Page,
	{ email, password }: TLoginInput,
): Promise<void> => {
	await page.goto("/login");
	await page.getByLabel(AUTH_MESSAGE.FIELD_EMAIL).pressSequentially(email);
	await page
		.getByLabel(AUTH_MESSAGE.FIELD_PASSWORD)
		.pressSequentially(password);
	await page.getByRole("button", { name: AUTH_MESSAGE.LOGIN_ACTION }).click();
};

export const signIn = async (
	page: Page,
	credentials: TLoginInput,
): Promise<void> => {
	await submitLogin(page, credentials);
	await expect(page).toHaveURL(/\/dashboard/);
};

export const signInExpectingRejection = async (
	page: Page,
	credentials: TLoginInput,
): Promise<void> => {
	await submitLogin(page, credentials);
	await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();
	await expect(page).toHaveURL(/\/login/);
};
