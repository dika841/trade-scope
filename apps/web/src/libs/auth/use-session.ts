import type { TMe } from "@app/schemas";
import { useSelector } from "@tanstack/react-store";
import { sessionStore } from "#/libs/auth/session-store.ts";

export const useSession = (): TMe | null =>
	useSelector(sessionStore, (state) => state.session);
