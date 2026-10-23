import { Separator } from "@app/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@app/components/ui/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { match, P } from "ts-pattern";
import { EServerUnreachable } from "#/libs/auth/server-unreachable.ts";
import { SESSION_REACH } from "#/libs/auth/session-reach.ts";
import { AppSidebar } from "#/routes/_authenticated/_components/app-sidebar.tsx";

const AuthenticatedLayout: FC = (): ReactElement => (
	<SidebarProvider>
		<AppSidebar />
		<SidebarInset>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 !h-4" />
			</header>
			<div className="min-w-0 flex-1 overflow-y-auto p-6">
				<div className="mx-auto w-full max-w-7xl">
					<Outlet />
				</div>
			</div>
		</SidebarInset>
	</SidebarProvider>
);

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		match(context)
			.with({ reach: SESSION_REACH.UNREACHABLE }, () => {
				throw new EServerUnreachable();
			})
			.with({ session: P.nullish }, () => {
				throw redirect({ to: "/login", search: { redirect: location.href } });
			})
			.otherwise(() => undefined);
	},
	component: AuthenticatedLayout,
});
