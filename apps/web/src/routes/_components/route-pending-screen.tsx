import { Skeleton } from "@app/components/ui/skeleton";
import { APP_MESSAGE } from "@app/messages";
import { A } from "@mobily/ts-belt";
import type { FC, ReactElement } from "react";

const PENDING_ROWS = ["first", "second", "third", "fourth", "fifth"] as const;

export const RoutePendingScreen: FC = (): ReactElement => (
	<output
		aria-label={APP_MESSAGE.LOADING}
		className="flex w-full flex-col gap-6"
	>
		<Skeleton className="h-7 w-48" />
		<div className="flex flex-col gap-3">
			{A.map(PENDING_ROWS, (row) => (
				<Skeleton key={row} className="h-10 w-full" />
			))}
		</div>
	</output>
);
