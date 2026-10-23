import { D } from "@mobily/ts-belt";
import type { SearchSchemaInput } from "@tanstack/react-router";
import { match, P } from "ts-pattern";
import { z } from "zod";

const fieldAccepts = (
	shape: z.ZodRawShape,
	key: string,
	value: unknown,
): boolean =>
	match(D.get(shape, key))
		.with(P.nullish, (): boolean => false)
		.otherwise((field): boolean => z.safeParse(field, value).success);

export const searchLenient =
	<TSchema extends z.ZodObject>(schema: TSchema) =>
	(raw: z.input<TSchema> & SearchSchemaInput): z.output<TSchema> =>
		schema.parse(
			D.filterWithKey(raw, (key, value): boolean =>
				fieldAccepts(schema.shape, String(key), value),
			),
		);
