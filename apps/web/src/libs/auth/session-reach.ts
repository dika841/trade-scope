import type { TMe } from "@app/schemas";

export const SESSION_REACH = {
	REACHED: "reached",
	UNREACHABLE: "unreachable",
} as const;

export type TSessionReach = (typeof SESSION_REACH)[keyof typeof SESSION_REACH];

export type TSessionResolution =
	| { reach: typeof SESSION_REACH.REACHED; session: TMe | null }
	| { reach: typeof SESSION_REACH.UNREACHABLE; session: null };
