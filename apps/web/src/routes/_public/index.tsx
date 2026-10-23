import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { CATALOG_MESSAGE } from "@app/messages";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { ProductSearchForm } from "#/routes/_public/_components/product-search-form.tsx";

const STEPS = [
	{
		title: CATALOG_MESSAGE.LANDING_STEP_ONE_TITLE,
		body: CATALOG_MESSAGE.LANDING_STEP_ONE_BODY,
	},
	{
		title: CATALOG_MESSAGE.LANDING_STEP_TWO_TITLE,
		body: CATALOG_MESSAGE.LANDING_STEP_TWO_BODY,
	},
	{
		title: CATALOG_MESSAGE.LANDING_STEP_THREE_TITLE,
		body: CATALOG_MESSAGE.LANDING_STEP_THREE_BODY,
	},
] as const;

const LandingPage: FC = (): ReactElement => (
	<div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16 sm:py-24">
		<section className="flex flex-col items-center gap-6 text-center">
			<p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
				{CATALOG_MESSAGE.LANDING_EYEBROW}
			</p>
			<h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
				{CATALOG_MESSAGE.LANDING_TITLE}
			</h1>
			<p className="text-muted-foreground max-w-2xl text-base text-balance sm:text-lg">
				{CATALOG_MESSAGE.LANDING_SUBTITLE}
			</p>
			<div className="w-full max-w-2xl pt-2">
				<ProductSearchForm />
				<p className="text-muted-foreground mt-3 text-sm">
					{CATALOG_MESSAGE.LANDING_HINT}
				</p>
			</div>
		</section>

		<section className="grid gap-4 sm:grid-cols-3">
			{STEPS.map((step, index) => (
				<Card key={step.title}>
					<CardHeader>
						<p className="text-muted-foreground text-xs font-medium">
							{index + 1}
						</p>
						<CardTitle>{step.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">{step.body}</p>
					</CardContent>
				</Card>
			))}
		</section>
	</div>
);

export const Route = createFileRoute("/_public/")({
	component: LandingPage,
});
