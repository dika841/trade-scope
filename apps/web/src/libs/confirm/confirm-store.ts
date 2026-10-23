import { Store } from "@tanstack/store";
import { match, P } from "ts-pattern";

export type TPendingConfirm = {
	id: string;
	run: () => void;
};

export const confirmStore = new Store<TPendingConfirm | null>(null);

export const confirmRequest = (pending: TPendingConfirm): void =>
	confirmStore.setState(() => pending);

export const confirmClear = (): void => confirmStore.setState(() => null);

export const confirmRun = (): void => {
	match(confirmStore.state)
		.with(P.nullish, () => undefined)
		.otherwise((pending) => pending.run());
	confirmClear();
};
