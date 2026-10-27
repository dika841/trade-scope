import { PILOT_MESSAGE } from "@app/messages";
import { PILOT_NOTES_MAX, PILOT_STATUS } from "@app/schemas";
import { z } from "zod";

export const pilotCreateFormSchema = z
	.object({
		hsCode: z.string(),
		hsRevision: z.string(),
		productLabel: z.string(),
		marketIso2: z.string(),
		ownerId: z.string(),
		notes: z.string().max(PILOT_NOTES_MAX, PILOT_MESSAGE.NOTES_TOO_LONG),
	})
	.superRefine((value, context): void => {
		if (value.hsCode === "" || value.hsRevision === "") {
			context.addIssue({
				code: "custom",
				path: ["hsCode"],
				message: PILOT_MESSAGE.PRODUCT_REQUIRED,
			});
		}

		if (value.marketIso2 === "") {
			context.addIssue({
				code: "custom",
				path: ["marketIso2"],
				message: PILOT_MESSAGE.MARKET_REQUIRED,
			});
		}
	});

export type TPilotCreateFormValues = z.infer<typeof pilotCreateFormSchema>;

export const pilotEditFormSchema = z.object({
	status: z.enum(PILOT_STATUS),
	ownerId: z.string(),
	notes: z.string().max(PILOT_NOTES_MAX, PILOT_MESSAGE.NOTES_TOO_LONG),
});

export type TPilotEditFormValues = z.infer<typeof pilotEditFormSchema>;
