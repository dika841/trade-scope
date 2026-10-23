import type {
	FormAsyncValidateOrFn,
	FormValidateOrFn,
	ReactFormExtendedApi,
} from "@tanstack/react-form";
import type { FormEvent } from "react";

export type TFormValidator<TValues> = undefined | FormValidateOrFn<TValues>;
type TNoAsyncValidator<TValues> = undefined | FormAsyncValidateOrFn<TValues>;

export type TValidatedForm<
	TValues,
	TOnChange extends TFormValidator<TValues> = TFormValidator<TValues>,
	TOnBlur extends TFormValidator<TValues> = TFormValidator<TValues>,
	TOnSubmit extends TFormValidator<TValues> = TFormValidator<TValues>,
> = ReactFormExtendedApi<
	TValues,
	TFormValidator<TValues>,
	TOnChange,
	TNoAsyncValidator<TValues>,
	TOnBlur,
	TNoAsyncValidator<TValues>,
	TOnSubmit,
	TNoAsyncValidator<TValues>,
	TFormValidator<TValues>,
	TNoAsyncValidator<TValues>,
	TNoAsyncValidator<TValues>,
	unknown
>;

export type TFormHook<TForm> = {
	form: TForm;
	onSubmit: (event: FormEvent) => void;
};
