import { Label } from "@app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import { INGESTION_MESSAGE } from "@app/messages";
import { INGESTION_STATUS, type TIngestionStatus } from "@app/schemas";
import { D } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";
import { INGESTION_STATUS_LABEL } from "#/routes/_authenticated/ingestion/_components/status-badge.tsx";
import {
	INGESTION_FILTER_ALL,
	useIngestionFilters,
} from "#/routes/_authenticated/ingestion/_hooks/use-ingestion.ts";

const STATUSES = D.values(INGESTION_STATUS);

export const IngestionFilters: FC = (): ReactElement => {
	const { status, onStatusChange } = useIngestionFilters();

	return (
		<div className="flex flex-col gap-1">
			<Label htmlFor="ingestion-status">
				{INGESTION_MESSAGE.FILTER_STATUS}
			</Label>
			<Select value={status} onValueChange={onStatusChange}>
				<SelectTrigger id="ingestion-status" className="w-48">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={INGESTION_FILTER_ALL}>
						{INGESTION_MESSAGE.FILTER_STATUS_ALL}
					</SelectItem>
					{STATUSES.map((value: TIngestionStatus) => (
						<SelectItem key={value} value={value}>
							{INGESTION_STATUS_LABEL[value]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
