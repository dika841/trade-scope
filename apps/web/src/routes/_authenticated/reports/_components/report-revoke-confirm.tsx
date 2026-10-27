import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@app/components/ui/alert-dialog";
import { Button, buttonVariants } from "@app/components/ui/button";
import { APP_MESSAGE, REPORT_MESSAGE } from "@app/messages";
import type { FC, ReactElement } from "react";

type TReportRevokeConfirmProps = {
	disabled?: boolean;
	onConfirm: () => void;
};

export const ReportRevokeConfirm: FC<TReportRevokeConfirmProps> = (
	props,
): ReactElement => (
	<AlertDialog>
		<AlertDialogTrigger asChild>
			<Button variant="ghost" size="sm" disabled={props.disabled}>
				{REPORT_MESSAGE.REVOKE_ACTION}
			</Button>
		</AlertDialogTrigger>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>
					{REPORT_MESSAGE.REVOKE_CONFIRM_TITLE}
				</AlertDialogTitle>
				<AlertDialogDescription>
					{REPORT_MESSAGE.REVOKE_CONFIRM_DESCRIPTION}
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>{APP_MESSAGE.CANCEL}</AlertDialogCancel>
				<AlertDialogAction
					className={buttonVariants({ variant: "destructive" })}
					onClick={props.onConfirm}
				>
					{APP_MESSAGE.CONFIRM}
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
);
