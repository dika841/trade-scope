import { APP_MESSAGE } from "@app/messages";
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
import type { FC, ReactElement } from "react";

type TDeleteConfirmProps = {
	title: string;
	description: string;
	disabled?: boolean;
	onConfirm: () => void;
};

export const DeleteConfirm: FC<TDeleteConfirmProps> = (props): ReactElement => {
	const { disabled = false } = props;

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="ghost" size="sm" disabled={disabled}>
					{APP_MESSAGE.DELETE}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{props.title}</AlertDialogTitle>
					<AlertDialogDescription>{props.description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{APP_MESSAGE.CANCEL}</AlertDialogCancel>
					<AlertDialogAction
						className={buttonVariants({ variant: "destructive" })}
						onClick={props.onConfirm}
					>
						{APP_MESSAGE.DELETE}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
