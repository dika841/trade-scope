import { AUTH_MESSAGE } from "@app/messages";
import { loginInputSchema, type TLoginInput } from "@app/schemas";
import { useForm } from "@tanstack/react-form";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import type { FormEvent } from "react";
import { match, P } from "ts-pattern";
import { signInErrorMessage } from "#/libs/auth/auth-error.ts";
import type {
	TFormHook,
	TFormValidator,
	TValidatedForm,
} from "#/libs/forms/form-hook.ts";
import { authClient } from "#/libs/auth/client.ts";
import { returnToResolve } from "#/libs/auth/return-to.ts";
import { SESSION_REACH } from "#/libs/auth/session-reach.ts";
import { sessionRefresh } from "#/libs/auth/session.ts";
import { loginError } from "#/routes/_public/login/_stores/login-error-store.ts";

const DEFAULT_VALUES: TLoginInput = { email: "", password: "" };

const loginRouteApi = getRouteApi("/_public/login/");

type TLoginForm = TFormHook<
	TValidatedForm<
		TLoginInput,
		TFormValidator<TLoginInput>,
		typeof loginInputSchema,
		typeof loginInputSchema
	>
> & {
	serverError: string | null;
};

export const useLoginForm = (): TLoginForm => {
	const navigate = useNavigate();
	const { redirect } = loginRouteApi.useSearch();
	const serverError = useSelector(loginError.store);

	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onBlur: loginInputSchema,
			onSubmit: loginInputSchema,
		},
		onSubmit: async ({ value }) => {
			loginError.clear();
			const { error: signInError } = await authClient.signIn.email(value);

			await match(signInError)
				.with(P.nullish, async () => {
					const resolution = await sessionRefresh();

					await match(resolution)
						.with({ reach: SESSION_REACH.UNREACHABLE }, async () => {
							loginError.set(AUTH_MESSAGE.SESSION_UNREACHABLE);
						})
						.with({ session: P.nullish }, async () => {
							loginError.set(AUTH_MESSAGE.SESSION_UNVERIFIED);
						})
						.otherwise(async () => {
							await navigate({ href: returnToResolve(redirect) });
						});
				})
				.otherwise(async (found) => {
					loginError.set(signInErrorMessage(found));
				});
		},
	});

	const onSubmit = (event: FormEvent): void => {
		event.preventDefault();
		void form.handleSubmit();
	};

	return { form, serverError, onSubmit };
};
