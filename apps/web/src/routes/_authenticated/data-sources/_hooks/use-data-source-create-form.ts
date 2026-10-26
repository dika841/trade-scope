import { dataSourceCreateInputSchema } from "@app/schemas";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import {
	dataSourceFormSchema,
	type TDataSourceFormValues,
} from "#/routes/_authenticated/data-sources/_constants/form-schema.ts";
import { useDataSourceCreate } from "#/routes/_authenticated/data-sources/_hooks/use-data-sources.ts";

const DEFAULT_VALUES: TDataSourceFormValues = {
	name: "",
	url: "",
	secret: "",
	isActive: true,
};

type TDataSourceCreateForm = TConfirmedForm<
	TDataSourceFormValues,
	typeof dataSourceFormSchema
> & {
	isPending: boolean;
};

export const useDataSourceCreateForm = (): TDataSourceCreateForm => {
	const sourceCreate = useDataSourceCreate();

	const confirmed = useConfirmedForm({
		defaultValues: DEFAULT_VALUES,
		schema: dataSourceFormSchema,
		run: (value, form): void => {
			const payload = {
				name: value.name,
				url: value.url,
				isActive: value.isActive,
				...(value.secret === "" ? {} : { secret: value.secret }),
			};

			sourceCreate.mutate(dataSourceCreateInputSchema.parse(payload), {
				onSuccess: () => form.reset(),
			});
		},
	});

	return { ...confirmed, isPending: sourceCreate.isPending };
};
