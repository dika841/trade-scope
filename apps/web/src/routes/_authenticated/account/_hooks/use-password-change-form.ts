import { AUTH_MESSAGE } from "@app/messages";
import { passwordChangeInputSchema } from "@app/schemas";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { match, P } from "ts-pattern";
import { z } from "zod";
import { passwordChangeErrorMessage } from "#/libs/auth/auth-error.ts";
import { authClient } from "#/libs/auth/client.ts";
import { passwordChangeError } from "#/routes/_authenticated/account/_stores/password-change-error-store.ts";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";

const passwordChangeFormSchema = passwordChangeInputSchema
	.extend({ confirmPassword: z.string() })
	.refine((value) => value.newPassword === value.confirmPassword, {
		message: AUTH_MESSAGE.PASSWORDS_MISMATCH,
		path: ["confirmPassword"],
	});

type TPasswordChangeFormValues = z.input<typeof passwordChangeFormSchema>;

const DEFAULT_VALUES: TPasswordChangeFormValues = {
	currentPassword: "",
	newPassword: "",
	confirmPassword: "",
};

type TPasswordChangeForm = TConfirmedForm<
	TPasswordChangeFormValues,
	typeof passwordChangeFormSchema
> & {
	serverError: string | null;
	isPending: boolean;
};

export const usePasswordChangeForm = (): TPasswordChangeForm => {
	const serverError = useSelector(passwordChangeError.store);

	const passwordChange = useMutation({
		mutationFn: (value: TPasswordChangeFormValues) =>
			authClient.changePassword({
				currentPassword: value.currentPassword,
				newPassword: value.newPassword,
				revokeOtherSessions: true,
			}),
		onMutate: (): void => passwordChangeError.clear(),
		onSuccess: ({ error }): void => {
			match(error)
				.with(P.nullish, (): void => {
					toast.success(AUTH_MESSAGE.PASSWORD_CHANGED);
					confirmed.form.reset();
				})
				.otherwise((found): void => {
					passwordChangeError.set(passwordChangeErrorMessage(found));
				});
		},
		onError: (): void => {
			passwordChangeError.set(AUTH_MESSAGE.PASSWORD_CHANGE_FAILED);
		},
	});

	const confirmed = useConfirmedForm({
		defaultValues: DEFAULT_VALUES,
		schema: passwordChangeFormSchema,
		run: (value): void => passwordChange.mutate(value),
	});

	return {
		...confirmed,
		serverError,
		isPending: passwordChange.isPending,
	};
};
