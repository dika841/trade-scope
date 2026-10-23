import { Button } from "@app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@app/components/ui/dropdown-menu";
import { TABLE_MESSAGE } from "@app/messages";
import { A } from "@mobily/ts-belt";
import { Settings2 } from "lucide-react";
import type { FC, ReactElement } from "react";

export type TColumnToggle = {
	id: string;
	label: string;
	visible: boolean;
	toggle: () => void;
};

type TDataTableColumnsMenuProps = {
	columns: readonly TColumnToggle[];
};

export const DataTableColumnsMenu: FC<TDataTableColumnsMenuProps> = (
	props,
): ReactElement => (
	<DropdownMenu>
		<DropdownMenuTrigger asChild>
			<Button variant="outline" size="sm" className="ml-auto">
				<Settings2 />
				{TABLE_MESSAGE.COLUMNS}
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			{A.map(props.columns, (column) => (
				<DropdownMenuCheckboxItem
					key={column.id}
					checked={column.visible}
					onCheckedChange={column.toggle}
					onSelect={(event) => event.preventDefault()}
				>
					{column.label}
				</DropdownMenuCheckboxItem>
			))}
		</DropdownMenuContent>
	</DropdownMenu>
);
