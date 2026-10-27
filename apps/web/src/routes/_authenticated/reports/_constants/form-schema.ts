import { REPORT_MESSAGE } from "@app/messages";
import { REPORT_TITLE_MAX } from "@app/schemas";
import { z } from "zod";

export const reportCreateFormSchema = z
	.object({
		hsCode: z.string(),
		hsRevision: z.string(),
		productLabel: z.string(),
		title: z.string().max(REPORT_TITLE_MAX, REPORT_MESSAGE.TITLE_TOO_LONG),
	})
	.superRefine((value, context): void => {
		if (value.hsCode === "" || value.hsRevision === "") {
			context.addIssue({
				code: "custom",
				path: ["hsCode"],
				message: REPORT_MESSAGE.PRODUCT_REQUIRED,
			});
		}
	});

export type TReportCreateFormValues = z.infer<typeof reportCreateFormSchema>;
