import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { Label } from "@app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import {
	ACTIVITY_ACTION_LABEL,
	ACTIVITY_ENTITY_LABEL,
	ACTIVITY_MESSAGE,
} from "@app/messages";
import { A, D } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";
import { ACTIVITY_FILTER_ALL } from "#/routes/_authenticated/activity/_constants/filter.ts";
import { useActivityFilters } from "#/routes/_authenticated/activity/_hooks/use-activity.ts";

const ACTIONS = D.values(ACTIVITY_ACTION);
const RESOURCE_TYPES = D.values(ACTIVITY_RESOURCE_TYPE);

export const ActivityFilters: FC = (): ReactElement => {
	const { action, resourceType, onActionChange, onResourceTypeChange } =
		useActivityFilters();

	return (
		<div className="flex flex-wrap gap-4">
			<div className="flex flex-col gap-1">
				<Label htmlFor="activity-action">
					{ACTIVITY_MESSAGE.FILTER_ACTION}
				</Label>
				<Select value={action} onValueChange={onActionChange}>
					<SelectTrigger id="activity-action" className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ACTIVITY_FILTER_ALL}>
							{ACTIVITY_MESSAGE.FILTER_ACTION_ALL}
						</SelectItem>
						{A.map(ACTIONS, (value) => (
							<SelectItem key={value} value={value}>
								{ACTIVITY_ACTION_LABEL[value]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex flex-col gap-1">
				<Label htmlFor="activity-resource-type">
					{ACTIVITY_MESSAGE.FILTER_ENTITY}
				</Label>
				<Select value={resourceType} onValueChange={onResourceTypeChange}>
					<SelectTrigger id="activity-resource-type" className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ACTIVITY_FILTER_ALL}>
							{ACTIVITY_MESSAGE.FILTER_ENTITY_ALL}
						</SelectItem>
						{A.map(RESOURCE_TYPES, (value) => (
							<SelectItem key={value} value={value}>
								{ACTIVITY_ENTITY_LABEL[value]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};
