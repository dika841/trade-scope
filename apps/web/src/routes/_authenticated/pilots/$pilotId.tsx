import { Guard } from "@app/components/guard/guard";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { formatDateTime, orDash } from "@app/format";
import { PILOT_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { FC, ReactElement, ReactNode } from "react";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { FormPage } from "#/routes/_authenticated/_components/form-page.tsx";
import { PilotEditForm } from "#/routes/_authenticated/pilots/_components/pilot-edit-form.tsx";
import { PilotStatusBadge } from "#/routes/_authenticated/pilots/_components/status-badge.tsx";
import {
	pilotGetOptions,
	pilotOptionsQuery,
	usePilot,
	usePilotOptions,
} from "#/routes/_authenticated/pilots/_hooks/use-pilots.ts";
import { formatHsCode } from "#/routes/_public/search/_utils/format-hs-code.ts";

const SummaryItem: FC<{ label: string; value: ReactNode }> = (
	props,
): ReactElement => (
	<div className="flex flex-col gap-1">
		<span className="text-muted-foreground text-xs uppercase">
			{props.label}
		</span>
		<span className="text-sm">{props.value}</span>
	</div>
);

const PilotDetailPage: FC = (): ReactElement => {
	const { pilotId } = Route.useParams();
	const { data: pilot } = usePilot(pilotId);
	const { data: options } = usePilotOptions();

	return (
		<FormPage
			parentLabel={PILOT_MESSAGE.TITLE}
			parentTo="/pilots"
			backLabel={PILOT_MESSAGE.BACK_TO_PILOTS}
			title={pilot.productDescription}
			description={`${formatHsCode(pilot.hsCode)} · ${pilot.hsRevision} · ${pilot.marketName} (${pilot.marketIso2})`}
			meta={
				<div className="flex flex-wrap items-center gap-3">
					<PilotStatusBadge status={pilot.status} />
					<Link
						to="/products/$hsCode"
						params={{ hsCode: pilot.hsCode }}
						search={{ revision: pilot.hsRevision }}
						className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
					>
						{PILOT_MESSAGE.COLUMN_PRODUCT}
					</Link>
				</div>
			}
		>
			<Card>
				<CardHeader>
					<CardTitle>{PILOT_MESSAGE.EDIT_TITLE}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					<SummaryItem
						label={PILOT_MESSAGE.COLUMN_MARKET}
						value={`${pilot.marketName} (${pilot.marketIso2})`}
					/>
					<SummaryItem
						label={PILOT_MESSAGE.FIELD_OWNER}
						value={orDash(pilot.ownerName ?? pilot.ownerEmail)}
					/>
					<SummaryItem
						label={PILOT_MESSAGE.CREATED_BY}
						value={orDash(pilot.createdByEmail)}
					/>
					<SummaryItem
						label={PILOT_MESSAGE.UPDATED_AT}
						value={formatDateTime(pilot.updatedAt)}
					/>
					<div className="sm:col-span-2">
						<SummaryItem
							label={PILOT_MESSAGE.FIELD_NOTES}
							value={
								pilot.notes === null ? (
									orDash(pilot.notes)
								) : (
									<span className="whitespace-pre-line">{pilot.notes}</span>
								)
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Guard permissions={[PERMISSION.PILOT_MANAGE]}>
				<PilotEditForm key={pilot.id} pilot={pilot} options={options} />
			</Guard>
		</FormPage>
	);
};

export const Route = createFileRoute("/_authenticated/pilots/$pilotId")({
	beforeLoad: checkRoutePermissions({ permissions: [PERMISSION.PILOT_READ] }),
	loader: ({ context, params }) =>
		Promise.all([
			context.queryClient.ensureQueryData(pilotGetOptions(params.pilotId)),
			context.queryClient.ensureQueryData(pilotOptionsQuery()),
		]),
	component: PilotDetailPage,
});
