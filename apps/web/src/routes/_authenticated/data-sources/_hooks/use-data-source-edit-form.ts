import { dataSourceUpdateInputSchema, type TDataSource } from "@app/schemas";
import { useNavigate } from "@tanstack/react-router";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import {
	dataSourceEditFormSchema,
	type TDataSourceEditFormValues,
} from "#/routes/_authenticated/data-sources/_constants/form-schema.ts";
import { useDataSourceUpdate } from "#/routes/_authenticated/data-sources/_hooks/use-data-sources.ts";

type TDataSourceEditForm = TConfirmedForm<
	TDataSourceEditFormValues,
	typeof dataSourceEditFormSchema
> & {
	isPending: boolean;
};

export const useDataSourceEditForm = (
	source: TDataSource,
): TDataSourceEditForm => {
	const navigate = useNavigate();
	const sourceUpdate = useDataSourceUpdate();

	const confirmed = useConfirmedForm({
		defaultValues: {
			id: source.id,
			name: source.name,
			url: source.url,
			secret: "",
			isActive: source.isActive,
		},
		schema: dataSourceEditFormSchema,
		run: (value): void => {
			const payload = {
				id: value.id,
				name: value.name,
				url: value.url,
				isActive: value.isActive,
				...(value.secret === "" ? {} : { secret: value.secret }),
			};

			sourceUpdate.mutate(dataSourceUpdateInputSchema.parse(payload), {
				onSuccess: () => {
					void navigate({ to: "/data-sources" });
				},
			});
		},
	});

	return { ...confirmed, isPending: sourceUpdate.isPending };
};
