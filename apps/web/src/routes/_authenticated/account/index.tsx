import { AUTH_MESSAGE } from "@app/messages";
import { createFileRoute } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { AccountSummary } from "#/routes/_authenticated/account/_components/account-summary.tsx";
import { PasswordChangeForm } from "#/routes/_authenticated/account/_components/password-change-form.tsx";

const AccountPage: FC = (): ReactElement => {
	return (
		<div className="flex max-w-md flex-col gap-6">
			<h1 className="text-xl font-semibold">{AUTH_MESSAGE.ACCOUNT_TITLE}</h1>
			<AccountSummary />
			<PasswordChangeForm />
		</div>
	);
};

export const Route = createFileRoute("/_authenticated/account/")({
	component: AccountPage,
});
