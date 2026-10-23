import { APP_MESSAGE, CATALOG_MESSAGE } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";
import { useSession } from "#/libs/auth/use-session.ts";

export const PublicHeader: FC = (): ReactElement => {
	const session = useSession();

	return (
		<header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
			<div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-6">
				<Link to="/" className="text-sm font-semibold tracking-tight">
					{APP_MESSAGE.NAME}
				</Link>
				<nav className="flex items-center gap-1">
					<Button asChild variant="ghost" size="sm">
						<Link to="/search">{CATALOG_MESSAGE.SEARCH_ACTION}</Link>
					</Button>
					{session ? (
						<Button asChild variant="outline" size="sm">
							<Link to="/dashboard">Dashboard</Link>
						</Button>
					) : (
						<Button asChild variant="outline" size="sm">
							<Link to="/login">Admin</Link>
						</Button>
					)}
				</nav>
			</div>
		</header>
	);
};
