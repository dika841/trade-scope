import { ROLE } from "@app/permissions";
import { userCreateInputSchema } from "@app/schemas";
import { useNavigate } from "@tanstack/react-router";
import type { z } from "zod";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import { useUserCreate } from "#/routes/_authenticated/users/_hooks/use-users.ts";

type TUserCreateFormValues = z.input<typeof userCreateInputSchema>;

const DEFAULT_VALUES: TUserCreateFormValues = {
	name: "",
	email: "",
	password: "",
	role: ROLE.VIEWER,
};

type TUserCreateForm = TConfirmedForm<
	TUserCreateFormValues,
	typeof userCreateInputSchema
> & {
	isPending: boolean;
};

export const useUserCreateForm = (): TUserCreateForm => {
	const navigate = useNavigate();
	const userCreate = useUserCreate();

	const confirmed = useConfirmedForm({
		defaultValues: DEFAULT_VALUES,
		schema: userCreateInputSchema,
		run: (value): void =>
			userCreate.mutate(value, {
				onSuccess: () => void navigate({ to: "/users" }),
			}),
	});

	return { ...confirmed, isPending: userCreate.isPending };
};
