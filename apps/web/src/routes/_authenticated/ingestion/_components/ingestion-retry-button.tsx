import { Button } from "@app/components/ui/button";
import { INGESTION_MESSAGE } from "@app/messages";
import { useNavigate } from "@tanstack/react-router";
import { useState, type FC, type ReactElement } from "react";
import { ConfirmDialog } from "#/routes/_authenticated/_components/confirm-dialog.tsx";
import { useIngestionRetry } from "#/routes/_authenticated/ingestion/_hooks/use-ingestion.ts";

type TIngestionRetryButtonProps = {
	id: string;
};

export const IngestionRetryButton: FC<TIngestionRetryButtonProps> = (
	props,
): ReactElement => {
	const [open, setOpen] = useState(false);
	const retry = useIngestionRetry();
	const navigate = useNavigate();

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
				disabled={retry.isPending}
			>
				{INGESTION_MESSAGE.RETRY_ACTION}
			</Button>
			<ConfirmDialog
				open={open}
				title={INGESTION_MESSAGE.RETRY_CONFIRM_TITLE}
				description={INGESTION_MESSAGE.RETRY_CONFIRM_DESCRIPTION}
				onOpenChange={setOpen}
				onConfirm={() => {
					setOpen(false);
					retry.mutate(
						{ id: props.id },
						{
							onSuccess: (run) => {
								void navigate({
									to: "/ingestion/$runId",
									params: { runId: run.id },
								});
							},
						},
					);
				}}
			/>
		</>
	);
};
