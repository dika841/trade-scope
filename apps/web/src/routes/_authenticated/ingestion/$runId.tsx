import { Guard } from "@app/components/guard/guard";
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
import { INGESTION_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import {
	INGESTION_MODE,
	isIngestionTerminal,
	type TIngestionRunDetail,
} from "@app/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { A } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { FormPage } from "#/routes/_authenticated/_components/form-page.tsx";
import { IngestionRetryButton } from "#/routes/_authenticated/ingestion/_components/ingestion-retry-button.tsx";
import { IngestionStatusBadge } from "#/routes/_authenticated/ingestion/_components/status-badge.tsx";
import {
	ingestionRunOptions,
	useIngestionRun,
} from "#/routes/_authenticated/ingestion/_hooks/use-ingestion.ts";
import { formatDuration } from "#/routes/_authenticated/ingestion/_utils/duration.ts";

const RETRYABLE: readonly string[] = ["failed", "partial"];

const SummaryItem: FC<{ label: string; value: string }> = (
	props,
): ReactElement => (
	<div className="flex flex-col gap-1">
		<span className="text-xs text-muted-foreground">{props.label}</span>
		<span className="text-sm font-medium">{props.value}</span>
	</div>
);

const modeLabel = (run: TIngestionRunDetail): string =>
	run.mode === INGESTION_MODE.SOURCE
		? INGESTION_MESSAGE.MODE_SOURCE
		: INGESTION_MESSAGE.MODE_UPLOAD;

const sourceLabel = (run: TIngestionRunDetail): string =>
	orDash(run.sourceName ?? run.fileName);

const IngestionRunPage: FC = (): ReactElement => {
	const { runId } = Route.useParams();
	const { data: run } = useIngestionRun(runId);

	return (
		<FormPage
			parentLabel={INGESTION_MESSAGE.TITLE}
			parentTo="/ingestion"
			backLabel={INGESTION_MESSAGE.BACK_TO_RUNS}
			title={INGESTION_MESSAGE.RUN_TITLE}
			description={run.id}
			meta={
				<div className="flex flex-wrap items-center gap-3">
					<IngestionStatusBadge status={run.status} />
					{!isIngestionTerminal(run.status) && (
						<span className="text-sm text-muted-foreground">
							{INGESTION_MESSAGE.IN_PROGRESS}
						</span>
					)}
					{RETRYABLE.some((status) => status === run.status) && (
						<Guard permissions={[PERMISSION.INGESTION_RUN]}>
							<IngestionRetryButton id={run.id} />
						</Guard>
					)}
				</div>
			}
		>
			<Card>
				<CardHeader>
					<CardTitle>{INGESTION_MESSAGE.SUMMARY_TITLE}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_SOURCE}
							value={sourceLabel(run)}
						/>
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_MODE}
							value={modeLabel(run)}
						/>
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_TOTAL}
							value={String(run.totalRows)}
						/>
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_INSERTED}
							value={String(run.insertedRows)}
						/>
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_UPDATED}
							value={String(run.updatedRows)}
						/>
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_FAILED}
							value={String(run.failedRows)}
						/>
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_STARTED}
							value={orDash(
								run.startedAt === null ? null : formatDateTime(run.startedAt),
							)}
						/>
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_FINISHED}
							value={orDash(
								run.finishedAt === null ? null : formatDateTime(run.finishedAt),
							)}
						/>
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_DURATION}
							value={formatDuration(run.startedAt, run.finishedAt)}
						/>
						<SummaryItem
							label={INGESTION_MESSAGE.SUMMARY_TRIGGERED_BY}
							value={orDash(run.triggeredByEmail)}
						/>
					</div>
					{run.message !== null && (
						<p className="text-destructive text-sm">{run.message}</p>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>{INGESTION_MESSAGE.ERRORS_TITLE}</CardTitle>
				</CardHeader>
				<CardContent>
					{A.isEmpty(run.errors) ? (
						<p className="text-sm text-muted-foreground">
							{INGESTION_MESSAGE.ERRORS_EMPTY}
						</p>
					) : (
						<>
							<p className="mb-4 text-sm text-muted-foreground">
								{INGESTION_MESSAGE.ERRORS_BODY}
							</p>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{INGESTION_MESSAGE.COLUMN_ERROR_ROW}</TableHead>
										<TableHead>
											{INGESTION_MESSAGE.COLUMN_ERROR_MESSAGE}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{A.map(run.errors, (error) => (
										<TableRow key={`${error.row}-${error.message}`}>
											<TableCell className="w-20 text-muted-foreground">
												{error.row}
											</TableCell>
											<TableCell>{error.message}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</>
					)}
				</CardContent>
			</Card>
		</FormPage>
	);
};

export const Route = createFileRoute("/_authenticated/ingestion/$runId")({
	beforeLoad: checkRoutePermissions({
		permissions: [PERMISSION.INGESTION_READ],
	}),
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(ingestionRunOptions(params.runId)),
	component: IngestionRunPage,
});
