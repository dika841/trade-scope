import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { Checkbox } from "@app/components/ui/checkbox";
import { FieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { DATA_SOURCE_MESSAGE } from "@app/messages";
import { Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";
import { useDataSourceCreateForm } from "#/routes/_authenticated/data-sources/_hooks/use-data-source-create-form.ts";

export const DataSourceCreateForm: FC = (): ReactElement => {
	const { form, onSubmit, confirm, isPending } = useDataSourceCreateForm();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{DATA_SOURCE_MESSAGE.CREATE_TITLE}</CardTitle>
				<CardDescription>
					{DATA_SOURCE_MESSAGE.CREATE_DESCRIPTION}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="name">
							{(field) => (
								<div className="flex flex-col gap-2">
									<Label htmlFor={field.name}>
										{DATA_SOURCE_MESSAGE.FIELD_NAME}
									</Label>
									<Input
										id={field.name}
										value={field.state.value}
										placeholder={DATA_SOURCE_MESSAGE.NAME_PLACEHOLDER}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
						<form.Field name="url">
							{(field) => (
								<div className="flex flex-col gap-2">
									<Label htmlFor={field.name}>
										{DATA_SOURCE_MESSAGE.FIELD_URL}
									</Label>
									<Input
										id={field.name}
										type="url"
										value={field.state.value}
										placeholder={DATA_SOURCE_MESSAGE.URL_PLACEHOLDER}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
					</div>
					<form.Field name="secret">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name}>
									{DATA_SOURCE_MESSAGE.FIELD_SECRET}
								</Label>
								<Input
									id={field.name}
									type="password"
									autoComplete="off"
									value={field.state.value}
									placeholder={DATA_SOURCE_MESSAGE.SECRET_PLACEHOLDER}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="isActive">
						{(field) => (
							<div className="flex items-center gap-2">
								<Checkbox
									id={field.name}
									checked={field.state.value}
									onCheckedChange={(checked) =>
										field.handleChange(checked === true)
									}
								/>
								<Label htmlFor={field.name}>
									{DATA_SOURCE_MESSAGE.FIELD_ACTIVE}
								</Label>
							</div>
						)}
					</form.Field>
					<Button type="submit" disabled={isPending} className="self-start">
						{isPending && <Loader2 className="animate-spin" />}
						{isPending
							? DATA_SOURCE_MESSAGE.CREATING
							: DATA_SOURCE_MESSAGE.CREATE_ACTION}
					</Button>
				</form>
			</CardContent>
			<ConfirmDialog
				open={confirm.open}
				title={DATA_SOURCE_MESSAGE.CREATE_CONFIRM_TITLE}
				description={DATA_SOURCE_MESSAGE.CREATE_CONFIRM_DESCRIPTION}
				onOpenChange={confirm.onOpenChange}
				onConfirm={confirm.onConfirm}
			/>
		</Card>
	);
};
