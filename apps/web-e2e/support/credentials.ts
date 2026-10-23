import type { TLoginInput } from "@app/schemas";

export const SEED_CREDENTIALS = {
	admin: { email: "admin@test.app", password: "Password123" },
	analyst: { email: "analyst@test.app", password: "Password123" },
	viewer: { email: "viewer@test.app", password: "Password123" },
} as const satisfies Record<string, TLoginInput>;
