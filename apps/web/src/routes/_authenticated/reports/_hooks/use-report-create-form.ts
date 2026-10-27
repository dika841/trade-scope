import { reportCreateInputSchema, type TCatalogProduct } from "@app/schemas";
import { useNavigate } from "@tanstack/react-router";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import {
	reportCreateFormSchema,
	type TReportCreateFormValues,
} from "#/routes/_authenticated/reports/_constants/form-schema.ts";
import { useReportCreate } from "#/routes/_authenticated/reports/_hooks/use-reports.ts";

const DEFAULT_VALUES: TReportCreateFormValues = {
	hsCode: "",
	hsRevision: "",
	productLabel: "",
	title: "",
};

type TReportCreateForm = TConfirmedForm<
	TReportCreateFormValues,
	typeof reportCreateFormSchema
> & {
	isPending: boolean;
	onProductSelect: (product: TCatalogProduct) => void;
	onProductClear: () => void;
};

export const useReportCreateForm = (): TReportCreateForm => {
	const navigate = useNavigate();
	const create = useReportCreate();

	const confirmed = useConfirmedForm({
		defaultValues: DEFAULT_VALUES,
		schema: reportCreateFormSchema,
		run: (value): void => {
			create.mutate(
				reportCreateInputSchema.parse({
					hsCode: value.hsCode,
					hsRevision: value.hsRevision,
					title: value.title,
				}),
				{
					onSuccess: (report) => {
						void navigate({
							to: "/reports/$reportId",
							params: { reportId: report.id },
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
