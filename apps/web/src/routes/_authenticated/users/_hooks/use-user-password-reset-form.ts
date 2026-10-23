import { type TUser, userPasswordResetInputSchema } from "@app/schemas";
import type { z } from "zod";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import { useUserPasswordReset } from "#/routes/_authenticated/users/_hooks/use-users.ts";

const userPasswordResetFormSchema = userPasswordResetInputSchema.pick({
	password: true,
});

type TUserPasswordResetFormValues = z.input<typeof userPasswordResetFormSchema>;

const DEFAULT_VALUES: TUserPasswordResetFormValues = { password: "" };

type TUserPasswordResetForm = TConfirmedForm<
	TUserPasswordResetFormValues,
	typeof userPasswordResetFormSchema
> & {
	isPending: boolean;
};

export const useUserPasswordResetForm = (
	user: TUser,
): TUserPasswordResetForm => {
	const passwordReset = useUserPasswordReset();

	const confirmed = useConfirmedForm({
		defaultValues: DEFAULT_VALUES,
		schema: userPasswordResetFormSchema,
		run: (value, form): void =>
			passwordReset.mutate(
				{ id: user.id, password: value.password },
				{ onSuccess: () => form.reset() },
			),
	});

	return { ...confirmed, isPending: passwordReset.isPending };
};
