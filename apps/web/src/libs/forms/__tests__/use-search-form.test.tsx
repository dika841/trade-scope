import { FieldApi } from "@tanstack/react-form";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { SEARCH_DEBOUNCE_MS } from "#/libs/forms/search-debounce.ts";
import { useSearchForm } from "#/libs/forms/use-search-form.ts";

const schema = z.object({ search: z.string().optional() });

const QUERY = "hello";

describe("useSearchForm", () => {
	beforeEach((): void => {
		vi.useFakeTimers();
	});

	afterEach((): void => {
		vi.useRealTimers();
	});

	it("starts from the search already in the URL", (): void => {
		const { result } = renderHook(() =>
			useSearchForm(schema, { value: QUERY, onChange: (): void => undefined }),
		);

		expect(result.current.form.state.values.search).toBe(QUERY);
	});

	it("reports a typed search after the debounce, not on the keystroke itself", (): void => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useSearchForm(schema, { value: "", onChange }),
		);

		const field = new FieldApi({ form: result.current.form, name: "search" });
		field.mount();

		act((): void => {
			field.handleChange(QUERY);
		});
		expect(onChange).not.toHaveBeenCalled();

		act((): void => {
			vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
		});
		expect(onChange).toHaveBeenCalledWith(QUERY);
	});

	it("reports an empty string, not undefined, when the search is cleared", async (): Promise<void> => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useSearchForm(schema, { value: QUERY, onChange }),
		);

		await act(async (): Promise<void> => {
			result.current.form.setFieldValue("search", undefined);
			await result.current.form.handleSubmit();
		});

		expect(onChange).toHaveBeenLastCalledWith("");
	});
});
