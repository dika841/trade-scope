import { REPORT_MESSAGE } from "@app/messages";
import type { TReportShareInput, TSharedReport } from "@app/schemas";
import { Effect } from "effect";
import { toSharedReportDto } from "#/report/application/to-report-dto.ts";
import { ReportRepo, type TReportRepoId } from "#/report/domain/report.ts";
import { type EDatabase, ENotFound } from "#/shared/errors.ts";

export const reportShared = Effect.fn("reportShared")(function* ({
	token,
}: TReportShareInput): Effect.fn.Return<
	TSharedReport,
	ENotFound | EDatabase,
	TReportRepoId
> {
	const repo = yield* ReportRepo;
	const row = yield* repo.getByShareToken(token);

	if (row === null || row.revokedAt !== null) {
		return yield* new ENotFound({
			message: REPORT_MESSAGE.SHARED_NOT_FOUND_TITLE,
		});
	}

	return toSharedReportDto(row);
});
