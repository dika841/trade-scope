import { REPORT_MESSAGE } from "@app/messages";
import { PERMISSION } from "@app/permissions";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { checkRoutePermissions } from "#/libs/auth/route-guard.ts";
import { FormPage } from "#/routes/_authenticated/_components/form-page.tsx";
import { ReportCreateForm } from "#/routes/_authenticated/reports/_components/report-create-form.tsx";

const ReportCreatePage: FC = (): ReactElement => (
	<FormPage
		parentLabel={REPORT_MESSAGE.TITLE}
		parentTo="/reports"
		backLabel={REPORT_MESSAGE.BACK_TO_REPORTS}
		title={REPORT_MESSAGE.NEW_REPORT}
		description={REPORT_MESSAGE.CREATE_DESCRIPTION}
	>
		<ReportCreateForm />
	</FormPage>
);

export const Route = createFileRoute("/_authenticated/reports/new")({
	beforeLoad: checkRoutePermissions({
		permissions: [PERMISSION.REPORT_MANAGE],
	}),
	component: ReportCreatePage,
});
