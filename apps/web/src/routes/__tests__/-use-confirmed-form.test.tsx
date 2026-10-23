import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { confirmClear } from "#/libs/confirm/confirm-store.ts";
import { useConfirmedForm } from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";

const schema = z.object({ title: z.string().min(1) });

type TValues = z.input<typeof schema>;

const DEFAULT_VALUES: TValues = { title: "" };
const TITLE = "Test title";

describe("useConfirmedForm", () => {
	afterEach(confirmClear);

	it("asks for confirmation on submit and runs the action only once confirmed", async (): Promise<void> => {
		const run = vi.fn();
		const { result } = renderHook(() =>
			useConfirmedForm({ defaultValues: DEFAULT_VALUES, schema, run }),
		);

		await act(async (): Promise<void> => {
			result.current.form.setFieldValue("title", TITLE);
			await result.current.form.handleSubmit();
		});

		expect(result.current.confirm.open).toBe(true);
		expect(run).not.toHaveBeenCalled();

		act((): void => {
			result.current.confirm.onConfirm();
		});

		expect(run).toHaveBeenCalledTimes(1);
		expect(run.mock.calls[0]?.[0]).toEqual({ title: TITLE });
		expect(result.current.confirm.open).toBe(false);
	});

	it("hands the form to the action so it can reset after success", async (): Promise<void> => {
		const { result } = renderHook(() =>
			useConfirmedForm({
				defaultValues: DEFAULT_VALUES,
				schema,
				run: (_value, form): void => form.reset(),
			}),
		);

		await act(async (): Promise<void> => {
			result.current.form.setFieldValue("title", TITLE);
			await result.current.form.handleSubmit();
		});
		act((): void => {
			result.current.confirm.onConfirm();
		});

		expect(result.current.form.state.values.title).toBe("");
	});

	it("does not ask for confirmation while the values are invalid", async (): Promise<void> => {
		const run = vi.fn();
		const { result } = renderHook(() =>
			useConfirmedForm({ defaultValues: DEFAULT_VALUES, schema, run }),
		);

		await act(async (): Promise<void> => {
			await result.current.form.handleSubmit();
		});

		expect(result.current.confirm.open).toBe(false);
		expect(run).not.toHaveBeenCalled();
	});
});
