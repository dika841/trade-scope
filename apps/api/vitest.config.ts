import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
	test: {
		environment: "node",
		globals: false,
		include: ["src/**/*.{test,spec}.ts", "scripts/**/*.{test,spec}.ts"],
		passWithNoTests: true,
		fileParallelism: false,
	},
});
