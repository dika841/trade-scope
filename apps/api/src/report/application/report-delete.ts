import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { REPORT_MESSAGE } from "@app/messages";
import type { TReportIdInput } from "@app/schemas";
import { Effect } from "effect";
import { ReportRepo, type TReportRepoId } from "#/report/domain/report.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";
import { type EDatabase, ENotFound } from "#/shared/errors.ts";

export const reportDelete = Effect.fn("reportDelete")(function* (
	{ id }: TReportIdInput,
	actorId: string,
): Effect.fn.Return<
	{ id: string },
	ENotFound | EDatabase,
	TReportRepoId | TActivityRecorderId
> {
	const repo = yield* ReportRepo;
	const activityRepo = yield* ActivityRecorder;
	const removed = yield* repo.remove(id);

	if (!removed) {
		return yield* new ENotFound({ message: REPORT_MESSAGE.NOT_FOUND });
	}

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.REPORT_DELETE,
		resourceType: ACTIVITY_RESOURCE_TYPE.REPORT,
		resourceId: id,
	});

	return { id };
});
