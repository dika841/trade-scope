import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { Guard } from "@app/components/guard/guard";
import { DASHBOARD_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { FC, ReactElement } from "react";

export const QuickActions: FC = (): ReactElement => (
	<Card>
		<CardHeader className="pb-2">
			<CardTitle className="text-sm font-medium text-muted-foreground">
				{DASHBOARD_MESSAGE.QUICK_ACTIONS}
			</CardTitle>
		</CardHeader>
		<CardContent className="flex flex-col gap-2">
			<Guard permissions={[PERMISSION.USER_MANAGE]}>
				<Button variant="outline" size="sm" className="justify-start" asChild>
					<Link to="/users/create">
						<Plus className="size-4" />
						{DASHBOARD_MESSAGE.CREATE_USER}
					</Link>
				</Button>
			</Guard>
		</CardContent>
	</Card>
);
