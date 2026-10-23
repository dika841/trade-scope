import { NOT_SET } from "@app/format";
import type { TActivity } from "@app/schemas";
import { A, D } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";

const PAIR_SEPARATOR = ", ";
const KEY_VALUE_SEPARATOR = ": ";

export const metadataLabel = (metadata: TActivity["metadata"]): string =>
	match(metadata)
		.with(P.nullish, (): string => NOT_SET)
		.otherwise((found): string =>
			match(D.toPairs(found))
				.when(A.isEmpty, (): string => NOT_SET)
				.otherwise((pairs): string =>
					A.join(
						A.map(
							pairs,
							([key, value]) => `${key}${KEY_VALUE_SEPARATOR}${String(value)}`,
						),
						PAIR_SEPARATOR,
					),
				),
		);
