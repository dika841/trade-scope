import { FieldError } from "@app/components/ui/field-error";
import { Label } from "@app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import { USER_MESSAGE } from "@app/messages";
import { A } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";
import type { TRoleOption } from "#/routes/_authenticated/users/_hooks/use-role-options.ts";

type TUserRoleFieldProps = {
	id: string;
	value: string;
	roleOptions: readonly TRoleOption[];
	errors: readonly unknown[];
	disabled?: boolean;
	hint?: string;
	onBlur: () => void;
	onChange: (value: string) => void;
};

export const UserRoleField: FC<TUserRoleFieldProps> = (props): ReactElement => {
	const { disabled = false } = props;

	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={props.id}>{USER_MESSAGE.COLUMN_ROLE}</Label>
			<Select
				value={props.value}
				disabled={disabled}
				onValueChange={props.onChange}
			>
				<SelectTrigger id={props.id} className="w-full" onBlur={props.onBlur}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{A.map(props.roleOptions, (option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{props.hint && (
				<p className="text-xs text-muted-foreground">{props.hint}</p>
			)}
			<FieldError errors={props.errors} />
		</div>
	);
};
