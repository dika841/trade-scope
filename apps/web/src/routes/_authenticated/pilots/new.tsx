import { PILOT_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { FormPage } from "#/routes/_authenticated/_components/form-page.tsx";
import { PilotCreateForm } from "#/routes/_authenticated/pilots/_components/pilot-create-form.tsx";
import {
	pilotOptionsQuery,
	usePilotOptions,
} from "#/routes/_authenticated/pilots/_hooks/use-pilots.ts";

const PilotCreatePage: FC = (): ReactElement => {
	const options = usePilotOptions();

	return (
		<FormPage
			parentLabel={PILOT_MESSAGE.TITLE}
			parentTo="/pilots"
			backLabel={PILOT_MESSAGE.BACK_TO_PILOTS}
			title={PILOT_MESSAGE.NEW_PILOT}
			description={PILOT_MESSAGE.CREATE_DESCRIPTION}
		>
			<PilotCreateForm options={options.data} />
		</FormPage>
	);
};

export const Route = createFileRoute("/_authenticated/pilots/new")({
	beforeLoad: checkRoutePermissions({ permissions: [PERMISSION.PILOT_MANAGE] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(pilotOptionsQuery()),
	component: PilotCreatePage,
});
