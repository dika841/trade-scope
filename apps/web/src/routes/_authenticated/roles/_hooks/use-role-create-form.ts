import { roleCreateInputSchema } from "@app/schemas";
import { D } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import type { z } from "zod";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import { useRoleCreate } from "#/routes/_authenticated/roles/_hooks/use-roles.ts";

type TRoleCreateFormValues = z.input<typeof roleCreateInputSchema>;

const DEFAULT_VALUES: TRoleCreateFormValues = {
	key: "",
	label: "",
	description: "",
	permissions: [],
};

const payloadBuild = (value: TRoleCreateFormValues): TRoleCreateFormValues =>
	match(value.description)
		.with("", () => D.deleteKey(value, "description"))
		.otherwise(() => value);

type TRoleCreateForm = TConfirmedForm<
	TRoleCreateFormValues,
	typeof roleCreateInputSchema
> & {
	isPending: boolean;
};

export const useRoleCreateForm = (): TRoleCreateForm => {
	const roleCreate = useRoleCreate();

	const confirmed = useConfirmedForm({
		defaultValues: DEFAULT_VALUES,
		schema: roleCreateInputSchema,
		run: (value, form): void =>
			roleCreate.mutate(payloadBuild(value), {
				onSuccess: () => form.reset(),
			}),
	});

	return { ...confirmed, isPending: roleCreate.isPending };
};
