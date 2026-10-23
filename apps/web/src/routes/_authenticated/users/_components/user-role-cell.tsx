import { Guard } from "@app/components/guard/guard";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import { PERMISSION } from "@app/permissions";
import type { TUser } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";
import type { TRoleOption } from "#/routes/_authenticated/users/_hooks/use-role-options.ts";

const roleLabelOf = (options: readonly TRoleOption[], value: string): string =>
	A.find(options, (option) => option.value === value)?.label ?? value;

type TUserRoleCellProps = {
	user: TUser;
	roleOptions: readonly TRoleOption[];
	disabled: boolean;
	onChange: (role: string) => void;
};

export const UserRoleCell: FC<TUserRoleCellProps> = (props): ReactElement => (
	<Guard
		permissions={[PERMISSION.USER_MANAGE]}
		fallback={
			<span className="text-sm">
				{roleLabelOf(props.roleOptions, props.user.role)}
			</span>
		}
	>
		<Select
			value={props.user.role}
			disabled={props.disabled}
			onValueChange={props.onChange}
		>
			<SelectTrigger
				aria-label={`Role for ${props.user.name}`}
				className="w-40"
			>
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
	</Guard>
);
