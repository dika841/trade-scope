import { Card, CardContent } from "@app/components/ui/card";
import { AUTH_MESSAGE, roleLabel } from "@app/messages";
import type { FC, ReactElement } from "react";
import { match, P } from "ts-pattern";
import { useSession } from "#/libs/auth/use-session.ts";

export const AccountSummary: FC = (): ReactElement =>
	match(useSession())
		.with(P.nullish, () => (
			<p className="text-sm text-muted-foreground">
				{AUTH_MESSAGE.NOT_SIGNED_IN}
			</p>
		))
		.otherwise((session) => (
			<Card>
				<CardContent>
					<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
						<dt className="text-muted-foreground">{AUTH_MESSAGE.FIELD_NAME}</dt>
						<dd>{session.user.name}</dd>
						<dt className="text-muted-foreground">
							{AUTH_MESSAGE.FIELD_EMAIL}
						</dt>
						<dd>{session.user.email}</dd>
						<dt className="text-muted-foreground">{AUTH_MESSAGE.FIELD_ROLE}</dt>
						<dd>{roleLabel(session.user.role)}</dd>
					</dl>
				</CardContent>
			</Card>
		));
