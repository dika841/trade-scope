import { type TUser, userUpdateInputSchema } from "@app/schemas";
import { D } from "@mobily/ts-belt";
import { useNavigate } from "@tanstack/react-router";
import type { z } from "zod";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import {
	useIsSelf,
	useUserUpdate,
} from "#/routes/_authenticated/users/_hooks/use-users.ts";

const userEditFormSchema = userUpdateInputSchema
	.pick({ name: true, role: true })
	.required();

type TUserEditFormValues = z.input<typeof userEditFormSchema>;

type TUserEditForm = TConfirmedForm<
	TUserEditFormValues,
	typeof userEditFormSchema
> & {
	isPending: boolean;
	isSelf: boolean;
};

export const useUserEditForm = (user: TUser): TUserEditForm => {
	const navigate = useNavigate();
	const userUpdate = useUserUpdate();
	const isSelf = useIsSelf()(user.id);

	const defaultValues: TUserEditFormValues = {
		name: user.name,
		role: user.role,
	};

	const confirmed = useConfirmedForm({
		defaultValues,
		schema: userEditFormSchema,
		run: (value): void =>
			userUpdate.mutate(D.merge(value, { id: user.id }), {
				onSuccess: () => void navigate({ to: "/users" }),
			}),
	});

	return { ...confirmed, isPending: userUpdate.isPending, isSelf };
};
