import type { ProcedureUtils } from "@orpc/tanstack-query";
import type { UseSuspenseQueryOptions } from "@tanstack/react-query";

type TClientContext = Record<never, never>;

export const suspenseQueryOptionsFor = <TInput, TOutput, TError>(
	procedure: ProcedureUtils<TClientContext, TInput, TOutput, TError>,
	input: TInput,
): UseSuspenseQueryOptions<TOutput, TError> =>
	procedure.queryOptions({ input, queryKey: procedure.queryKey({ input }) });
