import { Button } from "@app/components/ui/button";
import { ERROR_MESSAGE } from "@app/messages";
import { Link } from "@tanstack/react-router";
import type { FC, ReactElement } from "react";

const NOT_FOUND_TITLE_ID = "not-found-title";

export const NotFoundScreen: FC = (): ReactElement => (
	<section
		aria-labelledby={NOT_FOUND_TITLE_ID}
		className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
	>
		<h1 id={NOT_FOUND_TITLE_ID} className="text-2xl font-bold uppercase">
			{ERROR_MESSAGE.NOT_FOUND_TITLE}
		</h1>
		<p className="max-w-prose text-sm font-light text-muted-foreground">
			{ERROR_MESSAGE.NOT_FOUND_BODY}
		</p>
		<Button asChild>
			<Link to="/">{ERROR_MESSAGE.GO_HOME}</Link>
		</Button>
	</section>
);
