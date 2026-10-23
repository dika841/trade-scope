import type {
	InferClientErrors,
	InferClientInputs,
	InferClientOutputs,
} from "@orpc/client";
import type { client } from "#/libs/orpc/client.ts";

export type TClientInputs = InferClientInputs<typeof client>;
export type TClientOutputs = InferClientOutputs<typeof client>;
export type TClientErrors = InferClientErrors<typeof client>;
