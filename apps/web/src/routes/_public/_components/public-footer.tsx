import { Link } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";

export const PublicFooter: FC = (): ReactElement => (
	<footer className="border-t">
		<div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
			<p>
				TradeScope helps Indonesian exporters compare import demand. Ranking is
				a research aid, not a prediction.
			</p>
			<nav className="flex gap-4">
				<Link to="/search" className="hover:text-foreground">
					Search
				</Link>
				<Link to="/login" className="hover:text-foreground">
					Admin
				</Link>
			</nav>
		</div>
	</footer>
);
