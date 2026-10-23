import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { Checkbox } from "@app/components/ui/checkbox";
import { Label } from "@app/components/ui/label";
import { PERMISSION_LABEL } from "@app/messages";
import type { TPermission } from "@app/permissions";
import { A } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";
import { PERMISSION_GROUPS } from "#/routes/_authenticated/roles/_constants/permission-groups.ts";
import { permissionsToggle } from "#/routes/_authenticated/roles/_utils/permissions-toggle.ts";

type TPermissionChecklistProps = {
	value: readonly TPermission[];
	onChange: (next: readonly TPermission[]) => void;
	disabled?: boolean;
};

export const PermissionChecklist: FC<TPermissionChecklistProps> = (
	props,
): ReactElement => {
	const { value, onChange, disabled = false } = props;

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{A.map(PERMISSION_GROUPS, (group) => (
				<Card key={group.resource} className="gap-3 py-4 shadow-none">
					<CardHeader className="px-4">
						<CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							{group.resource}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-2 px-4">
						{A.map(group.permissions, (permission) => (
							<div key={permission} className="flex items-center gap-2 text-sm">
								<Checkbox
									id={`permission-${permission}`}
									checked={A.includes(value, permission)}
									disabled={disabled}
									onCheckedChange={(checked) =>
										onChange(
											permissionsToggle(value, permission, checked === true),
										)
									}
								/>
								<Label htmlFor={`permission-${permission}`}>
									{PERMISSION_LABEL[permission]}
								</Label>
								<code className="ml-auto text-xs text-muted-foreground">
									{permission}
								</code>
							</div>
						))}
					</CardContent>
				</Card>
			))}
		</div>
	);
};
