import { useStore } from "@tanstack/react-store";
import { useId } from "react";
import { match } from "ts-pattern";
import {
	confirmClear,
	confirmRequest,
	confirmRun,
	confirmStore,
} from "#/libs/confirm/confirm-store.ts";

export type TConfirmedAction<TValue> = {
	open: boolean;
	request: (value: TValue) => void;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export const useConfirmedAction = <TValue>(
	run: (value: TValue) => void,
): TConfirmedAction<TValue> => {
	const id = useId();
	const open = useStore(confirmStore, (pending) => pending?.id === id);

	return {
		open,
		request: (value: TValue): void =>
			confirmRequest({ id, run: () => run(value) }),
		onOpenChange: (next: boolean): void =>
			match(next)
				.with(false, () => confirmClear())
				.otherwise(() => undefined),
		onConfirm: confirmRun,
	};
};
