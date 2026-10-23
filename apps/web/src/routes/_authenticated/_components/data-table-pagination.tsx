import { Button } from "@app/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import { TABLE_MESSAGE } from "@app/messages";
import { A } from "@mobily/ts-belt";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import type { FC, ReactElement } from "react";
import { PAGE_SIZES } from "#/libs/table/page-sizes.ts";

type TDataTablePaginationProps = {
	pageIndex: number;
	pageSize: number;
	pageCount: number;
	rowCount: number;
	canPrevious: boolean;
	canNext: boolean;
	onPageIndexChange: (index: number) => void;
	onPageSizeChange: (size: number) => void;
};

const rangeLabel = (props: TDataTablePaginationProps): string => {
	const from = Math.min(props.pageIndex * props.pageSize + 1, props.rowCount);
	const to = Math.min((props.pageIndex + 1) * props.pageSize, props.rowCount);
	return `${from}-${to} ${TABLE_MESSAGE.OF} ${props.rowCount}`;
};

export const DataTablePagination: FC<TDataTablePaginationProps> = (
	props,
): ReactElement => (
	<div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
		<div className="flex items-center gap-2">
			<span>{TABLE_MESSAGE.ROWS_PER_PAGE}</span>
			<Select
				value={String(props.pageSize)}
				onValueChange={(value) => props.onPageSizeChange(Number(value))}
			>
				<SelectTrigger size="sm" className="w-20">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{A.map(PAGE_SIZES, (size) => (
						<SelectItem key={size} value={String(size)}>
							{size}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
		<div className="flex items-center gap-4">
			<span>{rangeLabel(props)}</span>
			<span>
				{TABLE_MESSAGE.PAGE} {props.pageIndex + 1} {TABLE_MESSAGE.OF}{" "}
				{Math.max(props.pageCount, 1)}
			</span>
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon-sm"
					aria-label={TABLE_MESSAGE.FIRST_PAGE}
					disabled={!props.canPrevious}
					onClick={() => props.onPageIndexChange(0)}
				>
					<ChevronsLeft />
				</Button>
				<Button
					variant="outline"
					size="icon-sm"
					aria-label={TABLE_MESSAGE.PREVIOUS_PAGE}
					disabled={!props.canPrevious}
					onClick={() => props.onPageIndexChange(props.pageIndex - 1)}
				>
					<ChevronLeft />
				</Button>
				<Button
					variant="outline"
					size="icon-sm"
					aria-label={TABLE_MESSAGE.NEXT_PAGE}
					disabled={!props.canNext}
					onClick={() => props.onPageIndexChange(props.pageIndex + 1)}
				>
					<ChevronRight />
				</Button>
				<Button
					variant="outline"
					size="icon-sm"
					aria-label={TABLE_MESSAGE.LAST_PAGE}
					disabled={!props.canNext}
					onClick={() => props.onPageIndexChange(props.pageCount - 1)}
				>
					<ChevronsRight />
				</Button>
			</div>
		</div>
	</div>
);
