import { Badge } from "@app/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import {
	ACTIVITY_ACTION_LABEL,
	ACTIVITY_ENTITY_LABEL,
	DASHBOARD_MESSAGE,
} from "@app/messages";
import { A } from "@mobily/ts-belt";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { FC, ReactElement } from "react";
import { match } from "ts-pattern";
import type { TClientOutputs } from "#/libs/orpc/types.ts";
import { relativeTimeLabel } from "#/routes/_authenticated/dashboard/_utils/relative-time.ts";

type TActivity = TClientOutputs["activity"]["list"]["items"][number];

type TRecentActivityProps = {
	entries: readonly TActivity[];
};

export const RecentActivity: FC<TRecentActivityProps> = (
	props,
): ReactElement => (
	<Card className="col-span-full lg:col-span-2">
		<CardHeader className="flex flex-row items-center justify-between">
			<CardTitle className="text-sm font-medium text-muted-foreground">
				{DASHBOARD_MESSAGE.RECENT_ACTIVITY}
			</CardTitle>
			<Link
				to="/activity"
				className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				{DASHBOARD_MESSAGE.VIEW_ALL}
				<ArrowRight className="size-3" />
			</Link>
		</CardHeader>
		<CardContent>
			{match(A.isEmpty(props.entries))
				.with(true, () => (
					<p className="text-sm text-muted-foreground">
						{DASHBOARD_MESSAGE.RECENT_ACTIVITY_EMPTY}
					</p>
				))
				.otherwise(() => (
					<div className="space-y-3">
						{A.map(props.entries, (entry) => (
							<div
								key={entry.id}
								className="flex items-center justify-between gap-4"
							>
								<div className="flex min-w-0 items-center gap-3">
									<div className="size-2 shrink-0 rounded-full bg-primary/60" />
									<div className="min-w-0">
										<p className="truncate text-sm">
											<span className="font-medium">{entry.actorEmail}</span>
											<span className="text-muted-foreground">
												{" "}
												{ACTIVITY_ENTITY_LABEL[entry.resourceType]}
											</span>
										</p>
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<Badge variant="outline" className="text-xs">
										{ACTIVITY_ACTION_LABEL[entry.action]}
									</Badge>
									<span className="text-xs text-muted-foreground">
										{relativeTimeLabel(entry.createdAt, new Date())}
									</span>
								</div>
							</div>
						))}
					</div>
				))}
		</CardContent>
	</Card>
);
