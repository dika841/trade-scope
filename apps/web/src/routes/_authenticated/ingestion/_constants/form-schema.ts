import { INGESTION_MESSAGE } from "@app/messages";
import { INGESTION_MODE } from "@app/schemas";
import { z } from "zod";

export const ingestionRunFormSchema = z
	.object({
		mode: z.enum([INGESTION_MODE.UPLOAD, INGESTION_MODE.SOURCE]),
		sourceId: z.string(),
		fileName: z.string(),
		content: z.string(),
	})
	.superRefine((value, context): void => {
		if (value.mode === INGESTION_MODE.SOURCE && value.sourceId === "") {
			context.addIssue({
				code: "custom",
				path: ["sourceId"],
				message: INGESTION_MESSAGE.SOURCE_REQUIRED,
			});
		}

		if (value.mode === INGESTION_MODE.UPLOAD) {
			if (value.fileName === "") {
				context.addIssue({
					code: "custom",
					path: ["fileName"],
					message: INGESTION_MESSAGE.FILE_REQUIRED,
				});
			}

			if (value.content === "") {
				context.addIssue({
					code: "custom",
					path: ["content"],
					message: INGESTION_MESSAGE.FILE_REQUIRED,
				});
			}
		}
	});

export type TIngestionRunFormValues = z.infer<typeof ingestionRunFormSchema>;
