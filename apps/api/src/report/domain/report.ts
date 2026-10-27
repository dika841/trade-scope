import type { TReportListInput, TReportPayload } from "@app/schemas";
import { Context, type Effect } from "effect";
import type { EDatabase } from "#/shared/errors.ts";
import type { TRowPage } from "#/shared/pagination.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { REPO_TAG } from "#/shared/repo-tags.ts";

export type TReportSummaryRow = {
	id: string;
	title: string;
	hsCode: string;
	hsRevision: string;
	productDescription: string;
	periodYear: number | null;
	shareToken: string;
	revokedAt: Date | null;
	createdBy: string | null;
	createdByEmail: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type TReportRow = TReportSummaryRow & {
	payload: TReportPayload;
};

export type TReportCreateRowInput = {
	title: string;
	hsCode: string;
	hsRevision: string;
	productDescription: string;
	periodYear: number | null;
	payload: TReportPayload;
	shareToken: string;
	createdBy: string;
};

export type TReportRepo = {
	list: (
		input: TReportListInput,
	) => Effect.Effect<TRowPage<TReportSummaryRow>, EDatabase>;
	getById: (id: string) => Effect.Effect<TReportRow | null, EDatabase>;
	getByShareToken: (
		token: string,
	) => Effect.Effect<TReportRow | null, EDatabase>;
	create: (
		input: TReportCreateRowInput,
	) => Effect.Effect<TReportRow, EDatabase>;
	revoke: (id: string) => Effect.Effect<TReportRow | null, EDatabase>;
	remove: (id: string) => Effect.Effect<boolean, EDatabase>;
};

export type TReportRepoId = TServiceId<typeof REPO_TAG.REPORT>;

export const ReportRepo = Context.Service<TReportRepoId, TReportRepo>(
	REPO_TAG.REPORT,
);
