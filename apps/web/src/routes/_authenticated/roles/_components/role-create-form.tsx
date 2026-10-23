import { Button } from "@app/components/ui/button";
import { FieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { Textarea } from "@app/components/ui/textarea";
import type { FC, ReactElement } from "react";
import { PermissionChecklist } from "#/routes/_authenticated/roles/_components/permission-checklist.tsx";
import { useRoleCreateForm } from "#/routes/_authenticated/roles/_hooks/use-role-create-form.ts";
import { Card, CardContent } from "@app/components/ui/card";
import { ROLE_MESSAGE } from "@app/messages";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";

export const RoleCreateForm: FC = (): ReactElement => {
	const { form, onSubmit, confirm, isPending } = useRoleCreateForm();

	return (
		<Card>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<div className="grid gap-3 sm:grid-cols-2">
						<form.Field name="key">
							{(field) => (
								<div className="flex flex-col gap-1">
									<Label htmlFor={field.name}>{ROLE_MESSAGE.FIELD_KEY}</Label>
									<Input
										id={field.name}
										placeholder={ROLE_MESSAGE.KEY_PLACEHOLDER}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
						<form.Field name="label">
							{(field) => (
								<div className="flex flex-col gap-1">
									<Label htmlFor={field.name}>{ROLE_MESSAGE.FIELD_LABEL}</Label>
									<Input
										id={field.name}
										placeholder={ROLE_MESSAGE.LABEL_PLACEHOLDER}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
					</div>
					<form.Field name="description">
						{(field) => (
							<div className="flex flex-col gap-1">
								<Label htmlFor={field.name}>
									{ROLE_MESSAGE.FIELD_DESCRIPTION}
								</Label>
								<Textarea
									id={field.name}
									placeholder={ROLE_MESSAGE.DESCRIPTION_PLACEHOLDER}
									value={field.state.value ?? ""}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="permissions">
						{(field) => (
							<div className="flex flex-col gap-2">
								<span className="text-sm font-medium">
									{ROLE_MESSAGE.FIELD_PERMISSIONS}
								</span>
								<PermissionChecklist
									value={field.state.value ?? []}
									onChange={(next) => field.handleChange([...next])}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<Button type="submit" disabled={isPending} className="self-start">
						{isPending ? ROLE_MESSAGE.CREATING : ROLE_MESSAGE.CREATE_ACTION}
					</Button>
				</form>
				<ConfirmDialog
					open={confirm.open}
					title={ROLE_MESSAGE.CREATE_CONFIRM_TITLE}
					description={ROLE_MESSAGE.CREATE_CONFIRM_DESCRIPTION}
					onOpenChange={confirm.onOpenChange}
					onConfirm={confirm.onConfirm}
				/>
			</CardContent>
		</Card>
	);
};
