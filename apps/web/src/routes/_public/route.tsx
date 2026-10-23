import { createFileRoute, Outlet } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { match } from "ts-pattern";
import { EServerUnreachable } from "#/libs/auth/server-unreachable.ts";
import { SESSION_REACH } from "#/libs/auth/session-reach.ts";
import { PublicFooter } from "#/routes/_public/_components/public-footer.tsx";
import { PublicHeader } from "#/routes/_public/_components/public-header.tsx";

const PublicLayout: FC = (): ReactElement => (
	<div className="flex min-h-svh flex-col">
		<PublicHeader />
		<main className="flex-1">
			<Outlet />
		</main>
		<PublicFooter />
	</div>
);

export const Route = createFileRoute("/_public")({
	beforeLoad: ({ context }) => {
		match(context)
			.with({ reach: SESSION_REACH.UNREACHABLE }, () => {
				throw new EServerUnreachable();
			})
			.otherwise(() => undefined);
	},
	component: PublicLayout,
});
