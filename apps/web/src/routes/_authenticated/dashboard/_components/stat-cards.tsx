import { Guard } from "@app/components/guard/guard";
import { Skeleton } from "@app/components/ui/skeleton";
import { DASHBOARD_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { Shield, Users } from "lucide-react";
import { Suspense, type FC, type ReactElement } from "react";
import {
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

const StatSkeleton: FC = (): ReactElement => (
	<Skeleton className="h-[106px] rounded-xl" />
);

export const StatCards: FC = (): ReactElement => (
	<div className="grid gap-4 sm:grid-cols-2">
		<Guard permissions={[PERMISSION.USER_MANAGE]}>
			<Suspense fallback={<StatSkeleton />}>
				<UserStat />
			</Suspense>
			<Suspense fallback={<StatSkeleton />}>
				<RoleStat />
			</Suspense>
		</Guard>
	</div>
);
