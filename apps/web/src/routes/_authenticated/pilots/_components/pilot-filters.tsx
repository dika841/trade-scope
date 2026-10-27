import { Label } from "@app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import { PILOT_MESSAGE, PILOT_STATUS_LABEL } from "@app/messages";
import { PILOT_STATUS, type TPilotStatus } from "@app/schemas";
import { D } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";
import {
	PILOT_FILTER_ALL,
	usePilotFilters,
} from "#/routes/_authenticated/pilots/_hooks/use-pilots.ts";

const STATUSES = D.values(PILOT_STATUS);

export const PilotFilters: FC = (): ReactElement => {
	const { status, onStatusChange } = usePilotFilters();

	return (
		<div className="flex flex-col gap-1">
			<Label htmlFor="pilot-status">{PILOT_MESSAGE.FILTER_STATUS}</Label>
			<Select value={status} onValueChange={onStatusChange}>
				<SelectTrigger id="pilot-status" className="w-48">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={PILOT_FILTER_ALL}>
						{PILOT_MESSAGE.FILTER_STATUS_ALL}
					</SelectItem>
					{STATUSES.map((value: TPilotStatus) => (
						<SelectItem key={value} value={value}>
							{PILOT_STATUS_LABEL[value]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
