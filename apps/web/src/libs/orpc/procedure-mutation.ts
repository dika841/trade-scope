import { A } from "@mobily/ts-belt";
import type { ProcedureUtils } from "@orpc/tanstack-query";
import {
	type QueryClient,
	type QueryKey,
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { toastError } from "#/libs/orpc/toast-error.ts";

type TClientContext = Record<never, never>;

export type TMutationEffect = {
	message: string;
	invalidates: readonly QueryKey[];
};

export const invalidateKeys = async (
	queryClient: QueryClient,
	keys: readonly QueryKey[],
): Promise<void> => {
	await Promise.all(
		A.map(keys, (queryKey) => queryClient.invalidateQueries({ queryKey })),
	);
};

export const useProcedureMutation = <TInput, TOutput, TError extends Error>(
	procedure: ProcedureUtils<TClientContext, TInput, TOutput, TError>,
	effect: TMutationEffect,
): UseMutationResult<TOutput, TError, TInput> => {
	const queryClient = useQueryClient();

	return useMutation(
		procedure.mutationOptions({
			mutationKey: procedure.mutationKey(),
			onSuccess: (): Promise<void> => {
				toast.success(effect.message);
				return invalidateKeys(queryClient, effect.invalidates);
			},
			onError: toastError,
		}),
	);
};
