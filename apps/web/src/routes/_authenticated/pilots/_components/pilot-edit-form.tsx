import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { FieldError } from "@app/components/ui/field-error";
import { Label } from "@app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import { Textarea } from "@app/components/ui/textarea";
import { PILOT_MESSAGE, PILOT_STATUS_LABEL } from "@app/messages";
import {
	PILOT_STATUS_TRANSITION,
	type TPilot,
	type TPilotOptions,
	type TPilotStatus,
} from "@app/schemas";
import { Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";
import { usePilotEditForm } from "#/routes/_authenticated/pilots/_hooks/use-pilot-edit-form.ts";

const OWNER_NONE = "__none__";

type TPilotEditFormProps = {
	pilot: TPilot;
	options: TPilotOptions;
};

export const PilotEditForm: FC<TPilotEditFormProps> = (props): ReactElement => {
	const { form, onSubmit, confirm, isPending } = usePilotEditForm(props.pilot);
	const nextStatuses = PILOT_STATUS_TRANSITION[props.pilot.status];
	const statusOptions: readonly TPilotStatus[] = [
		props.pilot.status,
		...nextStatuses,
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>{PILOT_MESSAGE.EDIT_TITLE}</CardTitle>
				<CardDescription>{PILOT_MESSAGE.EDIT_DESCRIPTION}</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<form.Field name="status">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name}>{PILOT_MESSAGE.FIELD_STATUS}</Label>
								<Select
									value={field.state.value}
									onValueChange={(value) =>
										field.handleChange(value as TPilotStatus)
									}
								>
									<SelectTrigger id={field.name} className="w-full sm:w-64">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{statusOptions.map((status) => (
											<SelectItem key={status} value={status}>
												{status === props.pilot.status
													? PILOT_MESSAGE.STATUS_KEEP
													: PILOT_STATUS_LABEL[status]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{nextStatuses.length === 0 && (
									<p className="text-muted-foreground text-xs">
										{PILOT_MESSAGE.NO_TRANSITION}
									</p>
								)}
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field name="ownerId">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name}>{PILOT_MESSAGE.FIELD_OWNER}</Label>
								<Select
									value={
										field.state.value === "" ? OWNER_NONE : field.state.value
									}
									onValueChange={(value) =>
										field.handleChange(value === OWNER_NONE ? "" : value)
									}
								>
									<SelectTrigger id={field.name} className="w-full sm:w-64">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={OWNER_NONE}>
											{PILOT_MESSAGE.OWNER_PLACEHOLDER}
										</SelectItem>
										{props.options.owners.map((owner) => (
											<SelectItem key={owner.id} value={owner.id}>
												{owner.name} ({owner.email})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					<form.Field name="notes">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name}>{PILOT_MESSAGE.FIELD_NOTES}</Label>
								<Textarea
									id={field.name}
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder={PILOT_MESSAGE.NOTES_PLACEHOLDER}
									rows={4}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<Button type="submit" disabled={isPending} className="self-start">
						{isPending && <Loader2 className="animate-spin" />}
						{isPending ? PILOT_MESSAGE.SAVING : PILOT_MESSAGE.SAVE_CHANGES}
					</Button>
				</form>
			</CardContent>
			<ConfirmDialog
				open={confirm.open}
				title={PILOT_MESSAGE.SAVE_CONFIRM_TITLE}
				description={PILOT_MESSAGE.SAVE_CONFIRM_DESCRIPTION}
				onOpenChange={confirm.onOpenChange}
				onConfirm={confirm.onConfirm}
			/>
		</Card>
	);
};
