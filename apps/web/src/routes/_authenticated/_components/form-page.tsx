import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@app/components/ui/breadcrumb";
import { Button } from "@app/components/ui/button";
import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { FC, ReactElement, ReactNode } from "react";

type TFormPageProps = {
	parentLabel: string;
	parentTo: LinkProps["to"];
	backLabel: string;
	title: string;
	description: string;
	meta?: ReactNode;
	children: ReactNode;
};

export const FormPage: FC<TFormPageProps> = (props): ReactElement => (
	<div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link to={props.parentTo}>{props.parentLabel}</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>{props.title}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
		<div className="flex flex-col gap-2">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						{props.title}
					</h1>
					<p className="text-sm text-muted-foreground">{props.description}</p>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to={props.parentTo}>
						<ArrowLeft />
						{props.backLabel}
					</Link>
				</Button>
			</div>
			{props.meta}
		</div>
		{props.children}
	</div>
);
