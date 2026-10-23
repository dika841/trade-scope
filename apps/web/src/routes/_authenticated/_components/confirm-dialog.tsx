import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@app/components/ui/alert-dialog";
import { APP_MESSAGE } from "@app/messages";
import type { FC, ReactElement } from "react";

type TConfirmDialogProps = {
	open: boolean;
	title: string;
	description: string;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export const ConfirmDialog: FC<TConfirmDialogProps> = (props): ReactElement => (
	<AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>{props.title}</AlertDialogTitle>
				<AlertDialogDescription>{props.description}</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>{APP_MESSAGE.CANCEL}</AlertDialogCancel>
				<AlertDialogAction onClick={props.onConfirm}>
					{APP_MESSAGE.CONFIRM}
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
);
