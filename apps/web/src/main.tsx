import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { APP_MESSAGE } from "@app/messages";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { match, P } from "ts-pattern";
import { SESSION_REACH } from "#/libs/auth/session-reach.ts";
import { sessionRefresh } from "#/libs/auth/session.ts";
import { sessionStore } from "#/libs/auth/session-store.ts";
import { queryClient } from "#/libs/tanstack-query/index.ts";
import { RouteErrorScreen } from "#/routes/_components/route-error-screen.tsx";
import { RoutePendingScreen } from "#/routes/_components/route-pending-screen.tsx";
import { AppPermissions } from "#/routes/_components/app-permissions.tsx";
import { AppToaster } from "#/routes/_components/app-toaster.tsx";
import { routeTree } from "./routeTree.gen.ts";
import "./styles.css";

const router = createRouter({
	routeTree,
	context: {
		queryClient,
		reach: SESSION_REACH.UNREACHABLE,
		session: null,
		permissions: [],
	},
	defaultPreload: "intent",
	defaultPendingComponent: RoutePendingScreen,
	defaultErrorComponent: RouteErrorScreen,
	defaultPendingMs: 500,
	defaultPendingMinMs: 300,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

sessionStore.subscribe(() => {
	const { reach, session } = sessionStore.state;
	router.update({
		...router.options,
		context: {
			queryClient,
			reach,
			session,
			permissions: session?.permissions ?? [],
		},
	});
	// Do not invalidate the router here. Invalidating while the session store is
	// being written re-enters matching and can loop indefinitely; guards read the
	// updated context on the next navigation, which is what login and sign-out do.
});

const bootstrap = async (): Promise<void> => {
	await sessionRefresh();

	const rootElement = document.getElementById("root");

	match(rootElement)
		.with(P.nullish, () => {
			throw new Error(APP_MESSAGE.ROOT_MISSING);
		})
		.otherwise((root) => {
			createRoot(root).render(
				<StrictMode>
					<QueryClientProvider client={queryClient}>
						<AppPermissions>
							<RouterProvider router={router} />
						</AppPermissions>
						<AppToaster />
					</QueryClientProvider>
				</StrictMode>,
			);
		});
};

void bootstrap();
