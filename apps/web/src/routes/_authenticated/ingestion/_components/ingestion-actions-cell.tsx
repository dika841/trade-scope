import { Guard } from "@app/components/guard/guard";
import { INGESTION_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import type { TIngestionRun } from "@app/schemas";
import { Link } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { IngestionRetryButton } from "#/routes/_authenticated/ingestion/_components/ingestion-retry-button.tsx";

const RETRYABLE: readonly string[] = ["failed", "partial"];

export const IngestionActionsCell: FC<{ run: TIngestionRun }> = (
	props,
): ReactElement => (
	<div className="flex items-center justify-end gap-1">
		<Link
			to="/ingestion/$runId"
			params={{ runId: props.run.id }}
			className="px-2 py-1 text-sm hover:underline"
		>
			{INGESTION_MESSAGE.ACTION_VIEW}
		</Link>
		{RETRYABLE.some((status) => status === props.run.status) && (
			<Guard permissions={[PERMISSION.INGESTION_RUN]}>
				<IngestionRetryButton id={props.run.id} />
			</Guard>
		)}
	</div>
);
