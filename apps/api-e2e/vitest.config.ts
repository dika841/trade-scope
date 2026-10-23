import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
	test: {
		environment: "node",
		globals: false,
		include: ["tests/**/*.e2e.test.ts"],
		globalSetup: ["./support/global-setup.ts"],
		sequence: { concurrent: false },
		fileParallelism: false,
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
});
