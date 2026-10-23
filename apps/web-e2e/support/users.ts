import { AUTH_MESSAGE, USER_MESSAGE } from "@app/messages";
import type { TUserCreateInput } from "@app/schemas";
import { expect, type Page } from "@playwright/test";
import { confirmAction } from "./confirm.ts";
import { selectOption } from "./select.ts";

export const createUser = async (
	page: Page,
	user: TUserCreateInput,
	roleLabel: string,
): Promise<void> => {
	await page.goto("/users/create");
	await page.getByLabel("Name", { exact: true }).fill(user.name);
	await page
		.getByLabel(AUTH_MESSAGE.FIELD_EMAIL, { exact: true })
		.fill(user.email);
	await page
		.getByLabel(AUTH_MESSAGE.FIELD_PASSWORD, { exact: true })
		.fill(user.password);
	await selectOption(page, page.getByLabel("Role", { exact: true }), roleLabel);
	await page.getByRole("button", { name: USER_MESSAGE.CREATE_ACTION }).click();
	await confirmAction(page);
	await expect(page).toHaveURL(/\/users(\?.*)?$/);
};
