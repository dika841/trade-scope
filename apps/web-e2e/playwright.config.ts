import { defineConfig, devices } from "@playwright/test";

const PORT = 5273;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
	testDir: "./tests",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: "list",
	use: {
		baseURL: BASE_URL,
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	globalSetup: "./support/global-setup.ts",
	globalTeardown: "./support/global-teardown.ts",
	webServer: {
		command: `pnpm --filter @app/web exec vite dev --host 127.0.0.1 --port ${PORT} --strictPort`,
		url: BASE_URL,
		reuseExistingServer: !process.env.CI,
		env: {
			VITE_API_URL: process.env.VITE_API_URL ?? "http://127.0.0.1:3108",
		},
	},
});
