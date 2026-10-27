import { Guard } from "@app/components/guard/guard";
import { Skeleton } from "@app/components/ui/skeleton";
import { DASHBOARD_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import {
	FileText,
	FlaskConical,
	Clock,
	Shield,
	TriangleAlert,
	Upload,
	Users,
} from "lucide-react";
import { Suspense, type FC, type ReactElement } from "react";
import {
	useDashboardIngestion,
	useDashboardPilots,
	useDashboardReports,
	useDashboardRoles,
	useDashboardUsers,
} from "#/routes/_authenticated/dashboard/_hooks/use-dashboard.ts";
import { StatCard } from "#/routes/_authenticated/dashboard/_components/stat-card.tsx";

const UserStat: FC = (): ReactElement => {
	const { total } = useDashboardUsers();
	return (
		<StatCard
			title={DASHBOARD_MESSAGE.TOTAL_USERS}
			value={total}
			icon={Users}
			to="/users"
		/>
	);
};

const RoleStat: FC = (): ReactElement => {
	const { total } = useDashboardRoles();
	return (
		<StatCard
			title={DASHBOARD_MESSAGE.TOTAL_ROLES}
			value={total}
			icon={Shield}
			to="/roles"
		/>
	);
};

const IngestionStat: FC = (): ReactElement => {
	const { total } = useDashboardIngestion();
	return (
		<StatCard
			title={DASHBOARD_MESSAGE.INGESTION_RUNS}
			value={total}
			icon={Upload}
			to="/ingestion"
		/>
	);
};

const IngestionAttentionStat: FC = (): ReactElement => {
	const { attention } = useDashboardIngestion();
	return (
		<StatCard
			title={DASHBOARD_MESSAGE.INGESTION_ATTENTION}
			value={attention}
			icon={TriangleAlert}
			to="/ingestion"
		/>
	);
};

const PilotStat: FC = (): ReactElement => {
	const { total } = useDashboardPilots();
	return (
		<StatCard
			title={DASHBOARD_MESSAGE.TOTAL_PILOTS}
			value={total}
			icon={FlaskConical}
			to="/pilots"
		/>
	);
};

const PilotAttentionStat: FC = (): ReactElement => {
	const { inReview } = useDashboardPilots();
	return (
		<StatCard
			title={DASHBOARD_MESSAGE.PILOTS_ATTENTION}
			value={inReview}
			icon={Clock}
			to="/pilots"
		/>
	);
};

const ReportStat: FC = (): ReactElement => {
	const { total } = useDashboardReports();
	return (
		<StatCard
			title={DASHBOARD_MESSAGE.TOTAL_REPORTS}
			value={total}
			icon={FileText}
			to="/reports"
		/>
	);
};

const StatSkeleton: FC = (): ReactElement => (
	<Skeleton className="h-[106px] rounded-xl" />
);

export const StatCards: FC = (): ReactElement => (
	<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Guard permissions={[PERMISSION.USER_MANAGE]}>
			<Suspense fallback={<StatSkeleton />}>
				<UserStat />
			</Suspense>
			<Suspense fallback={<StatSkeleton />}>
				<RoleStat />
			</Suspense>
		</Guard>
		<Guard permissions={[PERMISSION.INGESTION_READ]}>
			<Suspense fallback={<StatSkeleton />}>
				<IngestionStat />
			</Suspense>
			<Suspense fallback={<StatSkeleton />}>
				<IngestionAttentionStat />
			</Suspense>
		</Guard>
		<Guard permissions={[PERMISSION.PILOT_READ]}>
			<Suspense fallback={<StatSkeleton />}>
				<PilotStat />
			</Suspense>
			<Suspense fallback={<StatSkeleton />}>
				<PilotAttentionStat />
			</Suspense>
		</Guard>
		<Guard permissions={[PERMISSION.REPORT_READ]}>
			<Suspense fallback={<StatSkeleton />}>
				<ReportStat />
			</Suspense>
		</Guard>
	</div>
);
