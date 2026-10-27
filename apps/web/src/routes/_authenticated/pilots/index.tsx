import { Guard } from "@app/components/guard/guard";
import { Button } from "@app/components/ui/button";
import { PILOT_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { pilotListInputSchema } from "@app/schemas";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { FC, ReactElement } from "react";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { searchLenient } from "#/libs/table/search-lenient.ts";
import { PilotTable } from "#/routes/_authenticated/pilots/_components/pilot-table.tsx";
import {
	pilotListOptions,
	usePilotList,
	usePilotListChange,
} from "#/routes/_authenticated/pilots/_hooks/use-pilots.ts";

const pilotSearchValidate = searchLenient(pilotListInputSchema);

const PilotsPage: FC = (): ReactElement => {
	const { data } = usePilotList();
	const search = Route.useSearch();
	const onChange = usePilotListChange();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="text-xl font-semibold">{PILOT_MESSAGE.TITLE}</h1>
					<p className="text-sm text-muted-foreground">
						{PILOT_MESSAGE.SUBTITLE}
					</p>
				</div>
				<Guard permissions={[PERMISSION.PILOT_MANAGE]}>
					<Button asChild size="sm">
						<Link to="/pilots/new">
							<Plus className="mr-1 size-4" />
							{PILOT_MESSAGE.NEW_PILOT}
						</Link>
					</Button>
				</Guard>
			</div>
			<PilotTable
				list={data}
				sortBy={search.sortBy}
				sortDir={search.sortDir}
				onChange={onChange}
			/>
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/pilots/")({
	validateSearch: pilotSearchValidate,
	beforeLoad: checkRoutePermissions({ permissions: [PERMISSION.PILOT_READ] }),
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context, deps }) =>
		context.queryClient.ensureQueryData(pilotListOptions(deps.search)),
	component: PilotsPage,
});
