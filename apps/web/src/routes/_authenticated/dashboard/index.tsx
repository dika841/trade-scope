import { DASHBOARD_MESSAGE } from "@app/messages";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { ActivitySection } from "#/routes/_authenticated/dashboard/_components/activity-section.tsx";
import { HealthCard } from "#/routes/_authenticated/dashboard/_components/health-card.tsx";
import { QuickActions } from "#/routes/_authenticated/dashboard/_components/quick-actions.tsx";
import { StatCards } from "#/routes/_authenticated/dashboard/_components/stat-cards.tsx";
import { useDashboardHealth } from "#/routes/_authenticated/dashboard/_hooks/use-dashboard.ts";

const DashboardPage: FC = (): ReactElement => {
	const health = useDashboardHealth();

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-xl font-semibold">{DASHBOARD_MESSAGE.TITLE}</h1>
			<StatCards />
			<div className="grid gap-4 lg:grid-cols-3">
				<ActivitySection />
				<div className="flex flex-col gap-4">
					<HealthCard health={health} />
					<QuickActions />
				</div>
			</div>
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/dashboard/")({
	component: DashboardPage,
});
