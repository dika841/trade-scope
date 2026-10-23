import { userListInputSchema } from "@app/schemas";
import {
	type TSearchForm,
	useSearchForm,
} from "#/libs/forms/use-search-form.ts";
import { useUserSearch } from "#/routes/_authenticated/users/_hooks/use-users.ts";

const userSearchFormSchema = userListInputSchema.pick({ search: true });

export const useUserSearchForm = (): TSearchForm<typeof userSearchFormSchema> =>
	useSearchForm(userSearchFormSchema, useUserSearch());
