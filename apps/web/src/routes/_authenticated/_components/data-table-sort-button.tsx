import { Button } from "@app/components/ui/button";
import { SORT_DIRECTION, type TSortDirection } from "@app/schemas";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { FC, ReactElement, ReactNode } from "react";
import { match } from "ts-pattern";

type TDataTableSortButtonProps = {
	label: ReactNode;
	sorted: false | TSortDirection;
	onToggle: () => void;
};

const sortIcon = (sorted: false | TSortDirection): ReactElement =>
	match(sorted)
		.with(SORT_DIRECTION.ASC, () => <ArrowUp className="size-3.5" />)
		.with(SORT_DIRECTION.DESC, () => <ArrowDown className="size-3.5" />)
		.otherwise(() => <ChevronsUpDown className="size-3.5 opacity-50" />);

export const DataTableSortButton: FC<TDataTableSortButtonProps> = (
	props,
): ReactElement => (
	<Button
		variant="ghost"
		size="sm"
		className="-ml-3 h-8 gap-1.5 font-medium text-muted-foreground hover:text-foreground data-[sorted=true]:text-foreground"
		data-sorted={props.sorted !== false}
		onClick={props.onToggle}
	>
		{props.label}
		{sortIcon(props.sorted)}
	</Button>
);
