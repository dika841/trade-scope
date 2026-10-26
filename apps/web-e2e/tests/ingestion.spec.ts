import {
	DATA_SOURCE_MESSAGE,
	DASHBOARD_MESSAGE,
	INGESTION_MESSAGE,
} from "@app/messages";
import { expect, type Page, test } from "@playwright/test";
import { confirmAction } from "../support/confirm.ts";
import { SEED_CREDENTIALS } from "../support/credentials.ts";
import { signIn } from "../support/sign-in.ts";
import { rowWithCell } from "../support/table.ts";

const SOURCE_NAME = "Web E2E source";
const SOURCE_URL = "https://example.com/hs-codes.csv";
const SOURCE_TOKEN = "web-e2e-token-1234";
const RUN_STATUS_TIMEOUT_MS = 25_000;
const NEW_HS_CODE = "990001";
const CSV = `hs_code,hs_revision,description,aliases,language
${NEW_HS_CODE},HS2022,Web E2E imported product,produk web e2e,id
bad-code,HS2022,Rejected row,,id
`;

test.describe.configure({ mode: "serial" });

test.describe("ingestion admin flow", () => {
	let page: Page;

	test.beforeAll(async ({ browser }): Promise<void> => {
		page = await browser.newPage();
		await signIn(page, SEED_CREDENTIALS.admin);
	});

	test.afterAll(async (): Promise<void> => {
		await page.close();
	});

	test("adds a data source and shows its masked token", async (): Promise<void> => {
		await page.goto("/data-sources");
		await expect(
			page.getByRole("heading", { name: DATA_SOURCE_MESSAGE.TITLE }),
		).toBeVisible();

		await page.getByLabel(DATA_SOURCE_MESSAGE.FIELD_NAME).fill(SOURCE_NAME);
		await page.getByLabel(DATA_SOURCE_MESSAGE.FIELD_URL).fill(SOURCE_URL);
		await page.getByLabel(DATA_SOURCE_MESSAGE.FIELD_SECRET).fill(SOURCE_TOKEN);
		await page
			.getByRole("button", { name: DATA_SOURCE_MESSAGE.CREATE_ACTION })
			.click();
		await confirmAction(page);

		const row = rowWithCell(page, SOURCE_NAME);
		await expect(row).toBeVisible();
		await expect(row).toContainText("•••• 1234");
	});

	test("runs an uploaded CSV, reports the rejected row, and retries", async (): Promise<void> => {
		await page.goto("/ingestion");
		await expect(
			page.getByRole("heading", { name: INGESTION_MESSAGE.TITLE }),
		).toBeVisible();

		await page.getByLabel(INGESTION_MESSAGE.FILE_LABEL).setInputFiles({
			name: "web-e2e.csv",
			mimeType: "text/csv",
			buffer: Buffer.from(CSV),
		});
		await page
			.getByRole("button", { name: INGESTION_MESSAGE.RUN_ACTION })
			.click();
		await confirmAction(page);

		await expect(page).toHaveURL(/\/ingestion\/[0-9a-f-]+$/);
		await expect(
			page.getByText(INGESTION_MESSAGE.STATUS_PARTIAL).first(),
		).toBeVisible({ timeout: RUN_STATUS_TIMEOUT_MS });
		await expect(page.getByText(INGESTION_MESSAGE.ERRORS_BODY)).toBeVisible();
		await expect(page.getByText("Use a 2-12 character HS code")).toBeVisible();

		const firstUrl = page.url();
		await page
			.getByRole("button", { name: INGESTION_MESSAGE.RETRY_ACTION })
			.click();
		await confirmAction(page);
		await expect(page).not.toHaveURL(firstUrl);
		await expect(
			page.getByText(INGESTION_MESSAGE.STATUS_PARTIAL).first(),
		).toBeVisible({ timeout: RUN_STATUS_TIMEOUT_MS });
	});

	test("lists the finished runs", async (): Promise<void> => {
		await page.goto("/ingestion");
		await expect(rowWithCell(page, "web-e2e.csv").first()).toBeVisible();
	});

	test("shows ingestion counts on the dashboard", async (): Promise<void> => {
		await page.goto("/dashboard");
		await expect(
			page.getByText(DASHBOARD_MESSAGE.INGESTION_RUNS),
		).toBeVisible();
		await expect(
			page.getByText(DASHBOARD_MESSAGE.INGESTION_ATTENTION),
		).toBeVisible();
	});

	test("deletes the data source", async (): Promise<void> => {
		await page.goto("/data-sources");
		const row = rowWithCell(page, SOURCE_NAME);
		await row.getByRole("button", { name: "Delete" }).click();
		await page
			.getByRole("alertdialog")
			.getByRole("button", { name: "Delete" })
			.click();

		await expect(rowWithCell(page, SOURCE_NAME)).toHaveCount(0);
	});
});
