import { afterEach, describe, expect, it, vi } from "vitest";
import {
	confirmClear,
	confirmRequest,
	confirmRun,
	confirmStore,
} from "#/libs/confirm/confirm-store.ts";

const ID = "delete-item";

describe("confirm store", () => {
	afterEach(confirmClear);

	it("starts with nothing pending", (): void => {
		expect(confirmStore.state).toBeNull();
	});

	it("holds the action that asked for confirmation", (): void => {
		const run = vi.fn();

		confirmRequest({ id: ID, run });

		expect(confirmStore.state?.id).toBe(ID);
		expect(run).not.toHaveBeenCalled();
	});

	it("runs the pending action once on confirm and forgets it", (): void => {
		const run = vi.fn();
		confirmRequest({ id: ID, run });

		confirmRun();
		confirmRun();

		expect(run).toHaveBeenCalledTimes(1);
		expect(confirmStore.state).toBeNull();
	});

	it("does nothing on confirm when nothing is pending", (): void => {
		expect((): void => confirmRun()).not.toThrow();
		expect(confirmStore.state).toBeNull();
	});

	it("drops the pending action on clear without running it", (): void => {
		const run = vi.fn();
		confirmRequest({ id: ID, run });

		confirmClear();

		expect(run).not.toHaveBeenCalled();
		expect(confirmStore.state).toBeNull();
	});
});
