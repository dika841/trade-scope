import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] }), viteReact()],
	test: {
		environment: "jsdom",
		globals: false,
		setupFiles: ["./src/vitest.setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["src/routeTree.gen.ts"],
		coverage: {
			provider: "v8",
			thresholds: { lines: 90, statements: 90, functions: 90, branches: 75 },
			exclude: [
				"src/routes/**",
				"src/main.tsx",
				"src/routeTree.gen.ts",
				"src/libs/orpc/client.ts",
				"src/libs/auth/client.ts",
			],
		},
	},
});
