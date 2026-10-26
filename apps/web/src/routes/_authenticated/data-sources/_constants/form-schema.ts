import { DATA_SOURCE_MESSAGE } from "@app/messages";
import { z } from "zod";

const nameSchema = z
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

const urlSchema = z
	.url(DATA_SOURCE_MESSAGE.URL_INVALID)
	.max(2048, DATA_SOURCE_MESSAGE.URL_TOO_LONG)
	.refine(isHttpUrl, { message: DATA_SOURCE_MESSAGE.URL_PROTOCOL });

const secretSchema = z
	.string()
	.max(500, DATA_SOURCE_MESSAGE.SECRET_TOO_LONG)
	.refine(
		(value): boolean => value === "" || value.length >= 8,
		DATA_SOURCE_MESSAGE.SECRET_TOO_SHORT,
	);

export const dataSourceFormSchema = z.object({
	name: nameSchema,
	url: urlSchema,
	secret: secretSchema,
	isActive: z.boolean(),
});

export type TDataSourceFormValues = z.infer<typeof dataSourceFormSchema>;

export const dataSourceEditFormSchema = dataSourceFormSchema.extend({
	id: z.uuid(),
});

export type TDataSourceEditFormValues = z.infer<
	typeof dataSourceEditFormSchema
>;
