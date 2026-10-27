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
import { REPORT_MESSAGE } from "@app/messages";
import { Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";
import { ProductPicker } from "#/routes/_authenticated/pilots/_components/product-picker.tsx";
import { useReportCreateForm } from "#/routes/_authenticated/reports/_hooks/use-report-create-form.ts";

export const ReportCreateForm: FC = (): ReactElement => {
	const {
		form,
		onSubmit,
		confirm,
		isPending,
		onProductSelect,
		onProductClear,
	} = useReportCreateForm();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{REPORT_MESSAGE.CREATE_TITLE}</CardTitle>
				<CardDescription>{REPORT_MESSAGE.CREATE_DESCRIPTION}</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<form.Field name="hsCode">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label>{REPORT_MESSAGE.FIELD_PRODUCT}</Label>
								<ProductPicker
									selectedLabel={form.state.values.productLabel}
									onSelect={onProductSelect}
									onClear={onProductClear}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field name="title">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name}>{REPORT_MESSAGE.FIELD_TITLE}</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder={REPORT_MESSAGE.TITLE_PLACEHOLDER}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<Button type="submit" disabled={isPending} className="self-start">
						{isPending && <Loader2 className="animate-spin" />}
						{isPending ? REPORT_MESSAGE.CREATING : REPORT_MESSAGE.CREATE_ACTION}
					</Button>
				</form>
			</CardContent>
			<ConfirmDialog
				open={confirm.open}
				title={REPORT_MESSAGE.CREATE_TITLE}
				description={REPORT_MESSAGE.CREATE_DESCRIPTION}
				onOpenChange={confirm.onOpenChange}
				onConfirm={confirm.onConfirm}
			/>
		</Card>
	);
};
