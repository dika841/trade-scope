import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { Link, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { FC, ReactElement } from "react";

type TStatCardProps = {
	title: string;
	value: number;
	icon: LucideIcon;
	to: LinkProps["to"];
};

export const StatCard: FC<TStatCardProps> = (props): ReactElement => (
	<Link to={props.to} className="group">
		<Card className="transition-colors group-hover:border-primary/40">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{props.title}
				</CardTitle>
				<props.icon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<p className="text-3xl font-bold tracking-tight">{props.value}</p>
			</CardContent>
		</Card>
	</Link>
);
