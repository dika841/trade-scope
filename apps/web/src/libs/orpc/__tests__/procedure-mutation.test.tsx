import type { ProcedureUtils } from "@orpc/tanstack-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { FC, PropsWithChildren, ReactElement } from "react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import {
	invalidateKeys,
	useProcedureMutation,
} from "#/libs/orpc/procedure-mutation.ts";

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

type TInput = { name: string };
type TOutput = { id: string };
type TProcedure = ProcedureUtils<Record<never, never>, TInput, TOutput, Error>;

const CACHED_KEY = ["user", "list"];
const MESSAGE = "Saved.";
const FAILURE = "The user was changed by someone else.";

const procedureFake = (run: (input: TInput) => Promise<TOutput>): TProcedure =>
	({
		mutationKey: (): readonly unknown[] => ["user", "create"],
		mutationOptions: (options: Record<string, unknown>) => ({
			...options,
			mutationFn: run,
		}),
	}) as unknown as TProcedure;

const clientWithData = (): QueryClient => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(CACHED_KEY, { items: [] });
	return queryClient;
};

const wrapperFor =
	(queryClient: QueryClient): FC<PropsWithChildren> =>
	(props): ReactElement => (
		<QueryClientProvider client={queryClient}>
			{props.children}
		</QueryClientProvider>
	);

describe("useProcedureMutation", () => {
	it("toasts the message and invalidates the listed keys once the call succeeds", async (): Promise<void> => {
		const queryClient = clientWithData();
		const procedure = procedureFake(
			async (): Promise<TOutput> => ({ id: "1" }),
		);

		const { result } = renderHook(
			() =>
				useProcedureMutation(procedure, {
					message: MESSAGE,
					invalidates: [CACHED_KEY],
				}),
			{ wrapper: wrapperFor(queryClient) },
		);
		await act(async (): Promise<void> => {
			await result.current.mutateAsync({ name: "A user" });
		});

		expect(toast.success).toHaveBeenCalledWith(MESSAGE);
		expect(queryClient.getQueryState(CACHED_KEY)?.isInvalidated).toBe(true);
	});

	it("toasts the error and leaves the cache alone when the call fails", async (): Promise<void> => {
		const queryClient = clientWithData();
		const procedure = procedureFake(async (): Promise<TOutput> => {
			throw new Error(FAILURE);
		});

		const { result } = renderHook(
			() =>
				useProcedureMutation(procedure, {
					message: MESSAGE,
					invalidates: [CACHED_KEY],
				}),
			{ wrapper: wrapperFor(queryClient) },
		);
		act((): void => {
			result.current.mutate({ name: "A user" });
		});

		await waitFor((): void => {
			expect(toast.error).toHaveBeenCalledWith(FAILURE);
		});
		expect(queryClient.getQueryState(CACHED_KEY)?.isInvalidated).toBe(false);
	});
});

describe("invalidateKeys", () => {
	it("invalidates every key it is given", async (): Promise<void> => {
		const queryClient = clientWithData();
		const other = ["role", "list"];
		queryClient.setQueryData(other, { items: [] });

		await invalidateKeys(queryClient, [CACHED_KEY, other]);

		expect(queryClient.getQueryState(CACHED_KEY)?.isInvalidated).toBe(true);
		expect(queryClient.getQueryState(other)?.isInvalidated).toBe(true);
	});
});
