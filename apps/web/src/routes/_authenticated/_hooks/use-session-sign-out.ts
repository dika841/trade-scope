import { AUTH_MESSAGE } from "@app/messages";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authClient } from "#/libs/auth/client.ts";
import { sessionClear } from "#/libs/auth/session-store.ts";
import { signOutPerform } from "#/libs/auth/sign-out.ts";

export const useSessionSignOut = (): (() => Promise<void>) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return (): Promise<void> =>
		signOutPerform({
			signOut: () => authClient.signOut(),
			queryClient,
			onSignedOut: (): void => {
				sessionClear();
				void navigate({ to: "/login" });
			},
			onFailure: (): void => {
				toast.error(AUTH_MESSAGE.SIGN_OUT_FAILED);
			},
		});
};
