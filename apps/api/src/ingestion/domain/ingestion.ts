import type {
	TIngestionListInput,
	TIngestionMode,
	TIngestionRowError,
	TIngestionStatus,
} from "@app/schemas";
import { Context, type Effect } from "effect";
import type { TBaseRow } from "#/shared/base-row.ts";
import type { EDatabase, EQueue } from "#/shared/errors.ts";
import type { TRowPage } from "#/shared/pagination.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { REPO_TAG } from "#/shared/repo-tags.ts";

export type TIngestionRunRow = TBaseRow & {
	sourceId: string | null;
	sourceName: string | null;
	retryOfId: string | null;
	mode: TIngestionMode;
	fileName: string | null;
	payload: string | null;
	status: TIngestionStatus;
	totalRows: number;
	insertedRows: number;
	updatedRows: number;
	failedRows: number;
	errors: readonly TIngestionRowError[];
	message: string | null;
	triggeredBy: string | null;
	triggeredByEmail: string | null;
	startedAt: Date | null;
	finishedAt: Date | null;
};

export type TIngestionRunRowInput = {
	sourceId: string | null;
	retryOfId: string | null;
	mode: TIngestionMode;
	fileName: string | null;
	payload: string | null;
	triggeredBy: string;
};

export type TIngestionFinalizeInput = {
	id: string;
	status: TIngestionStatus;
	totalRows: number;
	insertedRows: number;
	updatedRows: number;
	failedRows: number;
	errors: readonly TIngestionRowError[];
	message: string | null;
};

export type TIngestionSourceRow = {
	id: string;
	name: string;
	url: string;
	secretCiphertext: string | null;
	isActive: boolean;
};

export type TIngestionProduct = {
	hsCode: string;
	hsRevision: string;
	description: string;
	parentHsCode: string | null;
	level: number;
	aliases: readonly string[];
	language: string;
	validFrom: string | null;
	validTo: string | null;
};

export type TIngestionCatalogCounts = {
	inserted: number;
	updated: number;
	aliases: number;
};

export type TIngestionStatsRow = {
	total: number;
	queued: number;
	running: number;
	succeeded: number;
	partial: number;
	failed: number;
	lastRunAt: Date | null;
};

export type TIngestionRepo = {
	list: (
		input: TIngestionListInput,
	) => Effect.Effect<TRowPage<TIngestionRunRow>, EDatabase>;
	getById: (id: string) => Effect.Effect<TIngestionRunRow | null, EDatabase>;
	create: (
		input: TIngestionRunRowInput,
	) => Effect.Effect<TIngestionRunRow, EDatabase>;
	markRunning: (
		id: string,
	) => Effect.Effect<TIngestionRunRow | null, EDatabase>;
	finalize: (
		input: TIngestionFinalizeInput,
	) => Effect.Effect<TIngestionRunRow | null, EDatabase>;
	failQueued: (id: string, message: string) => Effect.Effect<void, EDatabase>;
	findSource: (
		id: string,
	) => Effect.Effect<TIngestionSourceRow | null, EDatabase>;
	upsertCatalog: (input: {
		sourceLabel: string;
		products: readonly TIngestionProduct[];
	}) => Effect.Effect<TIngestionCatalogCounts, EDatabase>;
	stats: () => Effect.Effect<TIngestionStatsRow, EDatabase>;
};

export type TIngestionRepoId = TServiceId<typeof REPO_TAG.INGESTION>;

export const IngestionRepo = Context.Service<TIngestionRepoId, TIngestionRepo>(
	REPO_TAG.INGESTION,
);

export type TIngestionQueue = {
	enqueue: (runId: string) => Effect.Effect<void, EQueue>;
};

export type TIngestionQueueId = TServiceId<typeof REPO_TAG.INGESTION_QUEUE>;

export const IngestionQueue = Context.Service<
	TIngestionQueueId,
	TIngestionQueue
>(REPO_TAG.INGESTION_QUEUE);
