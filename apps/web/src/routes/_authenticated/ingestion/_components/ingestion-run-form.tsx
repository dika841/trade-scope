import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { FieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import { INGESTION_MESSAGE } from "@app/messages";
import {
	type TDataSource,
	INGESTION_MODE,
	type TIngestionMode,
} from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { Loader2 } from "lucide-react";
import type { ChangeEvent, FC, ReactElement } from "react";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";
import { useIngestionRunForm } from "#/routes/_authenticated/ingestion/_hooks/use-ingestion-run-form.ts";

type TIngestionRunFormProps = {
	sources: readonly TDataSource[];
};

const fileOf = (event: ChangeEvent<HTMLInputElement>): File | null =>
	event.target.files?.[0] ?? null;

export const IngestionRunForm: FC<TIngestionRunFormProps> = (
	props,
): ReactElement => {
	const {
		form,
		onSubmit,
		confirm,
		isPending,
		reading,
		fileError,
		onFileChange,
		onModeChange,
	} = useIngestionRunForm();
	const activeSources = A.filter(props.sources, (source) => source.isActive);
	const mode = form.state.values.mode;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{INGESTION_MESSAGE.NEW_RUN}</CardTitle>
				<CardDescription>{INGESTION_MESSAGE.SUBTITLE}</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<form.Field name="mode">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name}>
									{INGESTION_MESSAGE.MODE_LABEL}
								</Label>
								<Select
									value={field.state.value}
									onValueChange={(value) =>
										onModeChange(value as TIngestionMode)
									}
								>
									<SelectTrigger id={field.name} className="w-full sm:w-64">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={INGESTION_MODE.UPLOAD}>
											{INGESTION_MESSAGE.MODE_UPLOAD}
										</SelectItem>
										<SelectItem value={INGESTION_MODE.SOURCE}>
											{INGESTION_MESSAGE.MODE_SOURCE}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>
					{mode === INGESTION_MODE.UPLOAD ? (
						<form.Field name="fileName">
							{(field) => (
								<div className="flex flex-col gap-2">
									<Label htmlFor={field.name}>
										{INGESTION_MESSAGE.FILE_LABEL}
									</Label>
									<Input
										id={field.name}
										type="file"
										accept=".csv,text/csv"
										onChange={(event) => onFileChange(fileOf(event))}
									/>
									<p className="text-xs text-muted-foreground">
										{INGESTION_MESSAGE.FILE_HINT}
									</p>
									{fileError !== null && (
										<p className="text-destructive text-sm">{fileError}</p>
									)}
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
					) : (
						<form.Field name="sourceId">
							{(field) => (
								<div className="flex flex-col gap-2">
									<Label htmlFor={field.name}>
										{INGESTION_MESSAGE.SOURCE_LABEL}
									</Label>
									<Select
										value={field.state.value}
										onValueChange={field.handleChange}
									>
										<SelectTrigger id={field.name} className="w-full sm:w-96">
											<SelectValue
												placeholder={INGESTION_MESSAGE.SOURCE_PLACEHOLDER}
											/>
										</SelectTrigger>
										<SelectContent>
											{A.map(activeSources, (source) => (
												<SelectItem key={source.id} value={source.id}>
													{source.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{activeSources.length === 0 && (
										<p className="text-xs text-muted-foreground">
											{INGESTION_MESSAGE.NO_SOURCES}
										</p>
									)}
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
					)}
					<Button
						type="submit"
						disabled={isPending || reading}
						className="self-start"
					>
						{(isPending || reading) && <Loader2 className="animate-spin" />}
						{isPending || reading
							? INGESTION_MESSAGE.RUNNING
							: INGESTION_MESSAGE.RUN_ACTION}
					</Button>
				</form>
			</CardContent>
			<ConfirmDialog
				open={confirm.open}
				title={INGESTION_MESSAGE.RUN_CONFIRM_TITLE}
				description={INGESTION_MESSAGE.RUN_CONFIRM_DESCRIPTION}
				onOpenChange={confirm.onOpenChange}
				onConfirm={confirm.onConfirm}
			/>
		</Card>
	);
};
