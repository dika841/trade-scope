import { Store } from "@tanstack/store";

export type TServerErrorStore = {
	store: Store<string | null>;
	set: (message: string) => void;
	clear: () => void;
};

export const serverErrorStoreCreate = (): TServerErrorStore => {
	const store = new Store<string | null>(null);

	return {
		store,
		set: (message: string): void => store.setState(() => message),
		clear: (): void => store.setState(() => null),
	};
};
