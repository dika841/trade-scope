import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { toastError } from "#/libs/orpc/toast-error.ts";

vi.mock("sonner", () => ({
	toast: { error: vi.fn() },
}));

describe("toastError", () => {
	it("shows the error's message as a toast", (): void => {
		toastError(new Error("The resource was changed by someone else."));

		expect(toast.error).toHaveBeenCalledWith(
			"The resource was changed by someone else.",
		);
	});
});
