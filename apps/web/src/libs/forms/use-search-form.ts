import { type RejectPromiseValidator, useForm } from "@tanstack/react-form";
import type { FormEvent } from "react";
import type {
	TFormHook,
	TFormValidator,
	TValidatedForm,
} from "#/libs/forms/form-hook.ts";
import { SEARCH_DEBOUNCE_MS } from "#/libs/forms/search-debounce.ts";

export type TSearchValues = {
	search?: string | undefined;
};

export type TSearchControl = {
	value: string;
	onChange: (next: string) => void;
};

export type TSearchForm<TSchema extends TFormValidator<TSearchValues>> =
	TFormHook<TValidatedForm<TSearchValues, TSchema>>;

export const useSearchForm = <TSchema extends TFormValidator<TSearchValues>>(
	schema: RejectPromiseValidator<TSchema>,
	control: TSearchControl,
): TSearchForm<TSchema> => {
	const defaultValues: TSearchValues = { search: control.value };

	const form: TValidatedForm<TSearchValues, TSchema> = useForm({
		defaultValues,
		validators: { onChange: schema },
		listeners: {
			onChange: ({ formApi }) =>
				control.onChange(formApi.state.values.search ?? ""),
			onChangeDebounceMs: SEARCH_DEBOUNCE_MS,
		},
		onSubmit: ({ value }) => control.onChange(value.search ?? ""),
	});

	const onSubmit = (event: FormEvent): void => {
		event.preventDefault();
		void form.handleSubmit();
	};

	return { form, onSubmit };
};
