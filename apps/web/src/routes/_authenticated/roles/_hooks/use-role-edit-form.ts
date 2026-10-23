import { roleUpdateInputSchema, type TRoleDto } from "@app/schemas";
import { D } from "@mobily/ts-belt";
import { useNavigate } from "@tanstack/react-router";
import { match, P } from "ts-pattern";
import type { z } from "zod";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import { useRoleUpdate } from "#/routes/_authenticated/roles/_hooks/use-roles.ts";

const roleEditFormSchema = roleUpdateInputSchema.omit({ key: true }).required();

type TRoleEditFormValues = z.input<typeof roleEditFormSchema>;

type TRoleEditForm = TConfirmedForm<
	TRoleEditFormValues,
	typeof roleEditFormSchema
> & {
	isPending: boolean;
	isFixed: boolean;
};

const descriptionOf = (value: string | null): string | null =>
	match(value)
		.with(P.union("", P.nullish), (): null => null)
		.otherwise((text): string => text);

export const useRoleEditForm = (role: TRoleDto): TRoleEditForm => {
	const navigate = useNavigate();
	const roleUpdate = useRoleUpdate();

	const defaultValues: TRoleEditFormValues = {
		label: role.label,
		description: role.description ?? "",
		permissions: [...role.permissions],
	};

	const confirmed = useConfirmedForm({
		defaultValues,
		schema: roleEditFormSchema,
		run: (value): void =>
			roleUpdate.mutate(
				D.merge(value, {
					key: role.key,
					description: descriptionOf(value.description),
				}),
				{ onSuccess: () => void navigate({ to: "/roles" }) },
			),
	});

	return {
		...confirmed,
		isPending: roleUpdate.isPending,
		isFixed: role.fixed,
	};
};
