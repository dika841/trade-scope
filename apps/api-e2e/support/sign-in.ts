import type { TLoginInput } from "@app/schemas";
import { BASE_URL } from "./client.ts";

export const SEED_CREDENTIALS = {
	admin: { email: "admin@test.app", password: "Password123" },
	analyst: { email: "analyst@test.app", password: "Password123" },
	viewer: { email: "viewer@test.app", password: "Password123" },
} as const satisfies Record<string, TLoginInput>;

export const signIn = async ({
	email,
	password,
}: TLoginInput): Promise<string> => {
	const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	return response.headers.get("set-cookie") ?? "";
};
