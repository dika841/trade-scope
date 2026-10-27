import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { REPORT_MESSAGE } from "@app/messages";
import type { TReportIdInput, TReportSummary } from "@app/schemas";
import { Effect } from "effect";
import { toReportSummaryDto } from "#/report/application/to-report-dto.ts";
import { ReportRepo, type TReportRepoId } from "#/report/domain/report.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";
import { type EDatabase, ENotFound } from "#/shared/errors.ts";

export const reportRevoke = Effect.fn("reportRevoke")(function* (
	{ id }: TReportIdInput,
	actorId: string,
): Effect.fn.Return<
	TReportSummary,
	ENotFound | EDatabase,
	TReportRepoId | TActivityRecorderId
> {
	const repo = yield* ReportRepo;
	const activityRepo = yield* ActivityRecorder;
	const current = yield* repo.getById(id);

	if (current === null) {
		return yield* new ENotFound({ message: REPORT_MESSAGE.NOT_FOUND });
	}

	if (current.revokedAt !== null) {
		return toReportSummaryDto(current);
	}

	const revoked = yield* repo.revoke(id);

	if (revoked === null) {
		return yield* new ENotFound({ message: REPORT_MESSAGE.NOT_FOUND });
	}

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.REPORT_REVOKE,
		resourceType: ACTIVITY_RESOURCE_TYPE.REPORT,
		resourceId: revoked.id,
		metadata: { product: `${revoked.hsCode}@${revoked.hsRevision}` },
	});

	return toReportSummaryDto(revoked);
});
