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
import { PILOT_MESSAGE } from "@app/messages";
import type { TPilotOptions } from "@app/schemas";
import { Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";
import { ProductPicker } from "#/routes/_authenticated/pilots/_components/product-picker.tsx";
import { usePilotCreateForm } from "#/routes/_authenticated/pilots/_hooks/use-pilot-create-form.ts";

const OWNER_NONE = "__none__";

type TPilotCreateFormProps = {
	options: TPilotOptions;
};

export const PilotCreateForm: FC<TPilotCreateFormProps> = (
	props,
): ReactElement => {
	const {
		form,
		onSubmit,
		confirm,
		isPending,
		onProductSelect,
		onProductClear,
	} = usePilotCreateForm();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{PILOT_MESSAGE.CREATE_TITLE}</CardTitle>
				<CardDescription>{PILOT_MESSAGE.CREATE_DESCRIPTION}</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<form.Field name="hsCode">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label>{PILOT_MESSAGE.FIELD_PRODUCT}</Label>
								<ProductPicker
									selectedLabel={form.state.values.productLabel}
									onSelect={onProductSelect}
									onClear={onProductClear}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field name="marketIso2">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name}>{PILOT_MESSAGE.FIELD_MARKET}</Label>
								<Select
									value={field.state.value}
									onValueChange={field.handleChange}
								>
									<SelectTrigger id={field.name} className="w-full sm:w-64">
										<SelectValue
											placeholder={PILOT_MESSAGE.MARKET_PLACEHOLDER}
										/>
									</SelectTrigger>
									<SelectContent>
										{props.options.markets.map((market) => (
											<SelectItem key={market.iso2} value={market.iso2}>
												{market.name} ({market.iso2})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
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
						{isPending ? PILOT_MESSAGE.CREATING : PILOT_MESSAGE.CREATE_ACTION}
					</Button>
				</form>
			</CardContent>
			<ConfirmDialog
				open={confirm.open}
				title={PILOT_MESSAGE.CREATE_TITLE}
				description={PILOT_MESSAGE.CREATE_DESCRIPTION}
				onOpenChange={confirm.onOpenChange}
				onConfirm={confirm.onConfirm}
			/>
		</Card>
	);
};
