import { type RejectPromiseValidator, useForm } from "@tanstack/react-form";
import type { FormEvent } from "react";
import type {
	TFormHook,
	TFormValidator,
	TValidatedForm,
} from "#/libs/forms/form-hook.ts";
import {
	type TConfirmedAction,
	useConfirmedAction,
} from "#/routes/_authenticated/_hooks/use-confirmed-action.ts";

export type TConfirmedForm<
	TValues,
	TSchema extends TFormValidator<TValues>,
> = TFormHook<TValidatedForm<TValues, TSchema>> & {
	confirm: TConfirmedAction<TValues>;
};

type TConfirmedFormOptions<TValues, TSchema extends TFormValidator<TValues>> = {
	defaultValues: TValues;
	schema: RejectPromiseValidator<TSchema>;
	run: (value: TValues, form: TValidatedForm<TValues, TSchema>) => void;
};

export const useConfirmedForm = <
	TValues,
	TSchema extends TFormValidator<TValues>,
>(
	options: TConfirmedFormOptions<TValues, TSchema>,
): TConfirmedForm<TValues, TSchema> => {
	const confirm = useConfirmedAction<TValues>((value) =>
		options.run(value, form),
	);

	const form: TValidatedForm<TValues, TSchema> = useForm({
		defaultValues: options.defaultValues,
		validators: { onChange: options.schema },
		onSubmit: ({ value }) => confirm.request(value),
	});

	const onSubmit = (event: FormEvent): void => {
		event.preventDefault();
		void form.handleSubmit();
	};

	return { form, onSubmit, confirm };
};
