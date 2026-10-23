import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { USER_MESSAGE } from "@app/messages";
import type { TUser } from "@app/schemas";
import { Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";
import { UserTextField } from "#/routes/_authenticated/users/_components/user-text-field.tsx";
import { useUserPasswordResetForm } from "#/routes/_authenticated/users/_hooks/use-user-password-reset-form.ts";

type TUserPasswordResetFormProps = {
	user: TUser;
};

export const UserPasswordResetForm: FC<TUserPasswordResetFormProps> = (
	props,
): ReactElement => {
	const { form, onSubmit, confirm, isPending } = useUserPasswordResetForm(
		props.user,
	);

	return (
		<form onSubmit={onSubmit}>
			<Card>
				<CardHeader>
					<CardTitle>{USER_MESSAGE.PASSWORD_TITLE}</CardTitle>
					<CardDescription>{USER_MESSAGE.PASSWORD_DESCRIPTION}</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-6 sm:grid-cols-2">
					<form.Field name="password">
						{(field) => (
							<UserTextField
								id="reset-password"
								type="password"
								autoComplete="new-password"
								label={USER_MESSAGE.NEW_PASSWORD}
								placeholder={USER_MESSAGE.NEW_PASSWORD_PLACEHOLDER}
								value={field.state.value}
								errors={field.state.meta.errors}
								onBlur={field.handleBlur}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>
				</CardContent>
				<CardFooter className="justify-end border-t pt-6">
					<Button type="submit" variant="outline" disabled={isPending}>
						{isPending && <Loader2 className="animate-spin" />}
						{isPending ? USER_MESSAGE.RESETTING : USER_MESSAGE.RESET_ACTION}
					</Button>
				</CardFooter>
			</Card>
			<ConfirmDialog
				open={confirm.open}
				title={USER_MESSAGE.PASSWORD_RESET_CONFIRM_TITLE}
				description={USER_MESSAGE.PASSWORD_RESET_CONFIRM_DESCRIPTION}
				onOpenChange={confirm.onOpenChange}
				onConfirm={confirm.onConfirm}
			/>
		</form>
	);
};
