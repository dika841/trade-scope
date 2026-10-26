import { DATA_SOURCE_MESSAGE } from "@app/messages";
import { z } from "zod";
import { baseSchema } from "../shared/base-schema.ts";

export const DATA_SOURCE_KIND = {
	CSV: "csv",
} as const;

export type TDataSourceKind =
	(typeof DATA_SOURCE_KIND)[keyof typeof DATA_SOURCE_KIND];

const dataSourceNameSchema = z
	.string()
	.trim()
	.min(1, DATA_SOURCE_MESSAGE.NAME_REQUIRED)
	.max(100, DATA_SOURCE_MESSAGE.NAME_TOO_LONG);

const isHttpUrl = (value: string): boolean => {
	try {
		const protocol = new URL(value).protocol;
		return protocol === "http:" || protocol === "https:";
	} catch {
		return false;
	}
};

const dataSourceUrlSchema = z
	.url(DATA_SOURCE_MESSAGE.URL_INVALID)
	.max(2048, DATA_SOURCE_MESSAGE.URL_TOO_LONG)
	.refine(isHttpUrl, { message: DATA_SOURCE_MESSAGE.URL_PROTOCOL });

const secretSchema = z
	.string()
	.min(8, DATA_SOURCE_MESSAGE.SECRET_TOO_SHORT)
	.max(500, DATA_SOURCE_MESSAGE.SECRET_TOO_LONG);

const blankAsUndefined = (value: unknown): unknown =>
	value === "" ? undefined : value;

export const dataSourceSchema = baseSchema(z.uuid()).extend({
	name: z.string(),
	kind: z.enum(DATA_SOURCE_KIND),
	url: z.string(),
	isActive: z.boolean(),
	hasSecret: z.boolean(),
	secretHint: z.string().nullable(),
});
export type TDataSource = z.infer<typeof dataSourceSchema>;

export const dataSourceListSchema = z.object({
	items: z.array(dataSourceSchema).readonly(),
});
export type TDataSourceList = z.infer<typeof dataSourceListSchema>;

export const dataSourceCreateInputSchema = z.object({
	name: dataSourceNameSchema,
	url: dataSourceUrlSchema,
	secret: z.preprocess(blankAsUndefined, secretSchema.optional()),
	isActive: z.boolean().default(true),
});
export type TDataSourceCreateInput = z.infer<
	typeof dataSourceCreateInputSchema
>;

export const dataSourceUpdateInputSchema = z.object({
	id: z.uuid(),
	name: dataSourceNameSchema.optional(),
	url: dataSourceUrlSchema.optional(),
	secret: z.preprocess(blankAsUndefined, secretSchema.nullable().optional()),
	isActive: z.boolean().optional(),
});
export type TDataSourceUpdateInput = z.infer<
	typeof dataSourceUpdateInputSchema
>;

export const dataSourceIdInputSchema = z.object({ id: z.uuid() });
export type TDataSourceIdInput = z.infer<typeof dataSourceIdInputSchema>;

export const dataSourceOptionSchema = dataSourceSchema.pick({
	id: true,
	name: true,
	isActive: true,
});
export type TDataSourceOption = z.infer<typeof dataSourceOptionSchema>;
