import type { TReportList, TReportListInput } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { Effect } from "effect";
import { toReportSummaryDto } from "#/report/application/to-report-dto.ts";
import { ReportRepo, type TReportRepoId } from "#/report/domain/report.ts";
import type { EDatabase } from "#/shared/errors.ts";

export const reportList = Effect.fn("reportList")(function* (
	input: TReportListInput,
): Effect.fn.Return<TReportList, EDatabase, TReportRepoId> {
	const repo = yield* ReportRepo;
	const { items, total } = yield* repo.list(input);

	return {
		items: A.map(items, toReportSummaryDto),
		total,
		page: input.page,
		pageSize: input.pageSize,
	};
});
