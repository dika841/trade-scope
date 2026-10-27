import { pilotUpdateInputSchema, type TPilot } from "@app/schemas";
import { useQueryClient } from "@tanstack/react-query";
import { orpc } from "#/libs/orpc/client.ts";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import {
	pilotEditFormSchema,
	type TPilotEditFormValues,
} from "#/routes/_authenticated/pilots/_constants/form-schema.ts";
import { usePilotUpdate } from "#/routes/_authenticated/pilots/_hooks/use-pilots.ts";

type TPilotEditForm = TConfirmedForm<
	TPilotEditFormValues,
	typeof pilotEditFormSchema
> & {
	isPending: boolean;
};

export const usePilotEditForm = (pilot: TPilot): TPilotEditForm => {
	const update = usePilotUpdate();
	const queryClient = useQueryClient();

	const confirmed = useConfirmedForm({
		defaultValues: {
			status: pilot.status,
			ownerId: pilot.ownerId ?? "",
			notes: pilot.notes ?? "",
		},
		schema: pilotEditFormSchema,
		run: (value): void => {
			const notes = value.notes.trim();

			update.mutate(
				pilotUpdateInputSchema.parse({
					id: pilot.id,
					version: pilot.version,
					status: value.status === pilot.status ? undefined : value.status,
					ownerId: value.ownerId === "" ? null : value.ownerId,
					notes: notes === "" ? null : notes,
				}),
				{
					onError: () => {
						void queryClient.invalidateQueries({
							queryKey: orpc.pilot.key(),
						});
					},
				},
			);
		},
	});

	return { ...confirmed, isPending: update.isPending };
};
