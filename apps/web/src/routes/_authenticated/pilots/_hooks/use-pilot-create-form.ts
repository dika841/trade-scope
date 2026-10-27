import { pilotCreateInputSchema, type TCatalogProduct } from "@app/schemas";
import { useNavigate } from "@tanstack/react-router";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import {
	pilotCreateFormSchema,
	type TPilotCreateFormValues,
} from "#/routes/_authenticated/pilots/_constants/form-schema.ts";
import { usePilotCreate } from "#/routes/_authenticated/pilots/_hooks/use-pilots.ts";

const DEFAULT_VALUES: TPilotCreateFormValues = {
	hsCode: "",
	hsRevision: "",
	productLabel: "",
	marketIso2: "",
	ownerId: "",
	notes: "",
};

type TPilotCreateForm = TConfirmedForm<
	TPilotCreateFormValues,
	typeof pilotCreateFormSchema
> & {
	isPending: boolean;
	onProductSelect: (product: TCatalogProduct) => void;
	onProductClear: () => void;
};

export const usePilotCreateForm = (): TPilotCreateForm => {
	const navigate = useNavigate();
	const create = usePilotCreate();

	const confirmed = useConfirmedForm({
		defaultValues: DEFAULT_VALUES,
		schema: pilotCreateFormSchema,
		run: (value): void => {
			create.mutate(
				pilotCreateInputSchema.parse({
					hsCode: value.hsCode,
					hsRevision: value.hsRevision,
					marketIso2: value.marketIso2,
					ownerId: value.ownerId,
					notes: value.notes,
				}),
				{
					onSuccess: (pilot) => {
						void navigate({
							to: "/pilots/$pilotId",
							params: { pilotId: pilot.id },
						});
					},
				},
			);
		},
	});

	const onProductSelect = (product: TCatalogProduct): void => {
		confirmed.form.setFieldValue("hsCode", product.hsCode);
		confirmed.form.setFieldValue("hsRevision", product.hsRevision);
		confirmed.form.setFieldValue(
			"productLabel",
			`${product.hsCode} · ${product.description}`,
		);
	};

	const onProductClear = (): void => {
		confirmed.form.setFieldValue("hsCode", "");
		confirmed.form.setFieldValue("hsRevision", "");
		confirmed.form.setFieldValue("productLabel", "");
	};

	return {
		...confirmed,
		isPending: create.isPending,
		onProductSelect,
		onProductClear,
	};
};
