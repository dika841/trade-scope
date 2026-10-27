import {
	reportSchema,
	reportSummarySchema,
	sharedReportSchema,
	type TReport,
	type TReportSummary,
	type TSharedReport,
} from "@app/schemas";
import type { TReportRow, TReportSummaryRow } from "#/report/domain/report.ts";

export const toReportSummaryDto = (row: TReportSummaryRow): TReportSummary =>
	reportSummarySchema.parse({
		id: row.id,
		title: row.title,
		hsCode: row.hsCode,
		hsRevision: row.hsRevision,
		productDescription: row.productDescription,
		periodYear: row.periodYear,
		shareToken: row.shareToken,
		revokedAt: row.revokedAt === null ? null : row.revokedAt.toISOString(),
		createdBy: row.createdBy,
		createdByEmail: row.createdByEmail,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	});

export const toReportDto = (row: TReportRow): TReport =>
	reportSchema.parse({
		...toReportSummaryDto(row),
		payload: row.payload,
	});

export const toSharedReportDto = (row: TReportRow): TSharedReport =>
	sharedReportSchema.parse({
		title: row.title,
		hsCode: row.hsCode,
		hsRevision: row.hsRevision,
		productDescription: row.productDescription,
		createdAt: row.createdAt.toISOString(),
		payload: row.payload,
	});
