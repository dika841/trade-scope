import { FieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import type { FC, ReactElement } from "react";

type TUserTextFieldProps = {
	id: string;
	label: string;
	value: string;
	errors: readonly unknown[];
	type?: "text" | "email" | "password";
	placeholder?: string;
	autoComplete?: string;
	onBlur: () => void;
	onChange: (value: string) => void;
};

export const UserTextField: FC<TUserTextFieldProps> = (props): ReactElement => {
	const { type = "text" } = props;

	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={props.id}>{props.label}</Label>
			<Input
				id={props.id}
				type={type}
				value={props.value}
				placeholder={props.placeholder}
				autoComplete={props.autoComplete}
				onBlur={props.onBlur}
				onChange={(event) => props.onChange(event.target.value)}
			/>
			<FieldError errors={props.errors} />
		</div>
	);
};
