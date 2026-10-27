import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@app/components/ui/table";
import { formatDateTime, orDash } from "@app/format";
import { ACTIVITY_ACTION_LABEL, PILOT_MESSAGE } from "@app/messages";
import { Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { usePilotActivity } from "#/routes/_authenticated/pilots/_hooks/use-pilot-activity.ts";

type TPilotActivityProps = {
	pilotId: string;
};

export const PilotActivity: FC<TPilotActivityProps> = (props): ReactElement => {
	const activity = usePilotActivity(props.pilotId);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{PILOT_MESSAGE.ACTIVITY_TITLE}</CardTitle>
			</CardHeader>
			<CardContent>
				{activity.isPending ? (
					<span className="text-muted-foreground flex items-center gap-2 text-sm">
						<Loader2 className="size-4 animate-spin" />
						{PILOT_MESSAGE.ACTIVITY_TITLE}
					</span>
				) : activity.isError || activity.data.items.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						{PILOT_MESSAGE.ACTIVITY_EMPTY}
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{PILOT_MESSAGE.COLUMN_WHEN}</TableHead>
								<TableHead>{PILOT_MESSAGE.COLUMN_ACTOR}</TableHead>
								<TableHead>{PILOT_MESSAGE.COLUMN_ACTION}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{activity.data.items.map((entry) => (
								<TableRow key={entry.id}>
									<TableCell className="whitespace-nowrap text-muted-foreground">
										{formatDateTime(entry.createdAt)}
									</TableCell>
									<TableCell>{orDash(entry.actorEmail)}</TableCell>
									<TableCell>{ACTIVITY_ACTION_LABEL[entry.action]}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
};
