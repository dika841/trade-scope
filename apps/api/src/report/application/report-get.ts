import { REPORT_MESSAGE } from "@app/messages";
import type { TReport, TReportIdInput } from "@app/schemas";
import { Effect } from "effect";
import { toReportDto } from "#/report/application/to-report-dto.ts";
import { ReportRepo, type TReportRepoId } from "#/report/domain/report.ts";
import { type EDatabase, ENotFound } from "#/shared/errors.ts";

export const reportGet = Effect.fn("reportGet")(function* ({
	id,
}: TReportIdInput): Effect.fn.Return<
	TReport,
	ENotFound | EDatabase,
	TReportRepoId
> {
	const repo = yield* ReportRepo;
	const row = yield* repo.getById(id);

	if (row === null) {
		return yield* new ENotFound({ message: REPORT_MESSAGE.NOT_FOUND });
	}

	return toReportDto(row);
});
