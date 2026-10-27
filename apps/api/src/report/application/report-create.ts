import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import {
	MARKET_MAX_LIMIT,
	REPORT_TITLE_MAX,
	type TReport,
	type TReportCreateInput,
} from "@app/schemas";
import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { catalogGet } from "#/catalog/index.ts";
import type { TCatalogRepoId } from "#/catalog/index.ts";
import { marketGet } from "#/market/index.ts";
import type { TMarketRepoId } from "#/market/index.ts";
import { toReportDto } from "#/report/application/to-report-dto.ts";
import { ReportRepo, type TReportRepoId } from "#/report/domain/report.ts";
import { PilotRepo } from "#/pilot/index.ts";
import type { TPilotRepoId } from "#/pilot/index.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";
import type { EDatabase, ENotFound } from "#/shared/errors.ts";

const shareTokenOf = (): string => randomUUID().replaceAll("-", "");

export const reportCreate = Effect.fn("reportCreate")(function* (
	input: TReportCreateInput,
	actorId: string,
): Effect.fn.Return<
	TReport,
	ENotFound | EDatabase,
	| TReportRepoId
	| TCatalogRepoId
	| TMarketRepoId
	| TPilotRepoId
	| TActivityRecorderId
> {
	const repo = yield* ReportRepo;
	const pilotRepo = yield* PilotRepo;
	const activityRepo = yield* ActivityRecorder;

	const product = yield* catalogGet({
		hsCode: input.hsCode,
		revision: input.hsRevision,
	});

	const market = yield* marketGet({
		hsCode: product.hsCode,
		revision: product.hsRevision,
		limit: MARKET_MAX_LIMIT,
	});

	const pilots = yield* pilotRepo.listForProduct(
		product.hsCode,
		product.hsRevision,
	);

	const fallback =
		market.periodYear === null
			? product.description
			: `${product.description} — ${market.periodYear}`;
	const title = (input.title ?? fallback).slice(0, REPORT_TITLE_MAX);

	const row = yield* repo.create({
		title,
		hsCode: product.hsCode,
		hsRevision: product.hsRevision,
		productDescription: product.description,
		periodYear: market.periodYear,
		payload: {
			market,
			pilots: pilots.map((pilot) => ({
				id: pilot.id,
				marketIso2: pilot.marketIso2,
				marketName: pilot.marketName ?? pilot.marketIso2,
				status: pilot.status,
				updatedAt: pilot.updatedAt.toISOString(),
			})),
		},
		shareToken: shareTokenOf(),
		createdBy: actorId,
	});

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.REPORT_CREATE,
		resourceType: ACTIVITY_RESOURCE_TYPE.REPORT,
		resourceId: row.id,
		metadata: {
			product: `${product.hsCode}@${product.hsRevision}`,
			period: market.periodYear,
		},
	});

	return toReportDto(row);
});
