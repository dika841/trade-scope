import { Button } from "@app/components/ui/button";
import { FieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import type { FC, ReactElement } from "react";
import { usePasswordChangeForm } from "#/routes/_authenticated/account/_hooks/use-password-change-form.ts";
import { Card, CardContent } from "@app/components/ui/card";
import { AUTH_MESSAGE } from "@app/messages";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";

export const PasswordChangeForm: FC = (): ReactElement => {
	const { form, serverError, onSubmit, confirm, isPending } =
		usePasswordChangeForm();

	return (
		<Card>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<h2 className="font-medium">{AUTH_MESSAGE.PASSWORD_CHANGE_TITLE}</h2>
					<form.Field name="currentPassword">
						{(field) => (
							<div className="flex flex-col gap-1">
								<Label htmlFor={field.name}>
									{AUTH_MESSAGE.FIELD_CURRENT_PASSWORD}
								</Label>
								<Input
									id={field.name}
									type="password"
									autoComplete="current-password"
									placeholder={AUTH_MESSAGE.CURRENT_PASSWORD_PLACEHOLDER}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="newPassword">
						{(field) => (
							<div className="flex flex-col gap-1">
								<Label htmlFor={field.name}>
									{AUTH_MESSAGE.FIELD_NEW_PASSWORD}
								</Label>
								<Input
									id={field.name}
									type="password"
									autoComplete="new-password"
									placeholder={AUTH_MESSAGE.NEW_PASSWORD_PLACEHOLDER}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="confirmPassword">
						{(field) => (
							<div className="flex flex-col gap-1">
								<Label htmlFor={field.name}>
									{AUTH_MESSAGE.FIELD_CONFIRM_PASSWORD}
								</Label>
								<Input
									id={field.name}
									type="password"
									autoComplete="new-password"
									placeholder={AUTH_MESSAGE.CONFIRM_PASSWORD_PLACEHOLDER}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<FieldError errors={serverError ? [{ message: serverError }] : []} />
					<Button type="submit" disabled={isPending} className="self-start">
						{isPending
							? AUTH_MESSAGE.PASSWORD_UPDATING
							: AUTH_MESSAGE.PASSWORD_UPDATE}
					</Button>
				</form>
				<ConfirmDialog
					open={confirm.open}
					title={AUTH_MESSAGE.PASSWORD_CHANGE_CONFIRM_TITLE}
					description={AUTH_MESSAGE.PASSWORD_CHANGE_CONFIRM_DESCRIPTION}
					onOpenChange={confirm.onOpenChange}
					onConfirm={confirm.onConfirm}
				/>
			</CardContent>
		</Card>
	);
};
