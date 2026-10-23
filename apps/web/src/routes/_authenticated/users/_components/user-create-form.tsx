import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { APP_MESSAGE, USER_MESSAGE } from "@app/messages";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";
import { UserRoleField } from "#/routes/_authenticated/users/_components/user-role-field.tsx";
import { UserTextField } from "#/routes/_authenticated/users/_components/user-text-field.tsx";
import type { TRoleOption } from "#/routes/_authenticated/users/_hooks/use-role-options.ts";
import { useUserCreateForm } from "#/routes/_authenticated/users/_hooks/use-user-create-form.ts";

type TUserCreateFormProps = {
	roleOptions: readonly TRoleOption[];
};

export const UserCreateForm: FC<TUserCreateFormProps> = (
	props,
): ReactElement => {
	const { form, onSubmit, confirm, isPending } = useUserCreateForm();

	return (
		<form onSubmit={onSubmit}>
			<Card>
				<CardHeader>
					<CardTitle>{USER_MESSAGE.DETAILS_TITLE}</CardTitle>
					<CardDescription>
						{USER_MESSAGE.CREATE_DETAILS_DESCRIPTION}
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-6 sm:grid-cols-2">
					<form.Field name="name">
						{(field) => (
							<UserTextField
								id={field.name}
								label={USER_MESSAGE.COLUMN_NAME}
								placeholder={USER_MESSAGE.NAME_PLACEHOLDER}
								value={field.state.value}
								errors={field.state.meta.errors}
								onBlur={field.handleBlur}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>
					<form.Field name="email">
						{(field) => (
							<UserTextField
								id={field.name}
								type="email"
								label={USER_MESSAGE.COLUMN_EMAIL}
								placeholder={USER_MESSAGE.EMAIL_PLACEHOLDER}
								value={field.state.value}
								errors={field.state.meta.errors}
								onBlur={field.handleBlur}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>
					<form.Field name="password">
						{(field) => (
							<UserTextField
								id={field.name}
								type="password"
								autoComplete="new-password"
								label={USER_MESSAGE.COLUMN_PASSWORD}
								placeholder={USER_MESSAGE.PASSWORD_PLACEHOLDER}
								value={field.state.value}
								errors={field.state.meta.errors}
								onBlur={field.handleBlur}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>
					<form.Field name="role">
						{(field) => (
							<UserRoleField
								id={field.name}
								value={field.state.value}
								roleOptions={props.roleOptions}
								errors={field.state.meta.errors}
								onBlur={field.handleBlur}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>
				</CardContent>
				<CardFooter className="justify-end gap-2 border-t pt-6">
					<Button variant="outline" asChild>
						<Link to="/users">{APP_MESSAGE.CANCEL}</Link>
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2 className="animate-spin" />}
						{isPending ? USER_MESSAGE.CREATING : USER_MESSAGE.CREATE_ACTION}
					</Button>
				</CardFooter>
			</Card>
			<ConfirmDialog
				open={confirm.open}
				title={USER_MESSAGE.CREATE_CONFIRM_TITLE}
				description={USER_MESSAGE.CREATE_CONFIRM_DESCRIPTION}
				onOpenChange={confirm.onOpenChange}
				onConfirm={confirm.onConfirm}
			/>
		</form>
	);
};
