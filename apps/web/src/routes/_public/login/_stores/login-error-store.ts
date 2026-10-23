import {
	serverErrorStoreCreate,
	type TServerErrorStore,
} from "#/libs/forms/server-error-store.ts";

export const loginError: TServerErrorStore = serverErrorStoreCreate();
