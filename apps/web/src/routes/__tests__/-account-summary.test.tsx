import { PERMISSION, ROLE } from "@app/permissions";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { sessionSet } from "#/libs/auth/session-store.ts";
import { AccountSummary } from "#/routes/_authenticated/account/_components/account-summary.tsx";

afterEach((): void => {
	cleanup();
	sessionSet(null);
});

describe("AccountSummary", () => {
	it("shows the signed-in user's details with a readable role", (): void => {
		sessionSet({
			user: {
				id: "11111111-1111-4111-8111-111111111111",
				email: "ada@test.app",
				name: "Ada",
				role: ROLE.ADMIN,
			},
			permissions: [PERMISSION.USER_MANAGE],
		});

		render(<AccountSummary />);

		expect(screen.getByText("Ada")).toBeInTheDocument();
		expect(screen.getByText("ada@test.app")).toBeInTheDocument();
		expect(screen.getByText("Admin")).toBeInTheDocument();
	});

	it("renders a fallback when nobody is signed in", (): void => {
		render(<AccountSummary />);
		expect(screen.getByText("Not signed in.")).toBeInTheDocument();
	});
});
