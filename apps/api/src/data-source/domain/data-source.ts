import type {
	TDataSourceCreateInput,
	TDataSourceKind,
	TDataSourceUpdateInput,
} from "@app/schemas";
import { Context, type Effect } from "effect";
import type { TBaseRow } from "#/shared/base-row.ts";
import type { EDatabase } from "#/shared/errors.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { REPO_TAG } from "#/shared/repo-tags.ts";

export type TDataSourceRow = TBaseRow & {
	name: string;
	kind: TDataSourceKind;
	url: string;
	secretCiphertext: string | null;
	secretHint: string | null;
	isActive: boolean;
	createdBy: string | null;
};

export type TDataSourceCreateRowInput = TDataSourceCreateInput & {
	kind: TDataSourceKind;
	secretCiphertext: string | null;
	secretHint: string | null;
	createdBy: string;
};

export type TDataSourceUpdateRowInput = TDataSourceUpdateInput & {
	secretCiphertext?: string | null;
	secretHint?: string | null;
};

export type TDataSourceRepo = {
	list: () => Effect.Effect<readonly TDataSourceRow[], EDatabase>;
	findById: (id: string) => Effect.Effect<TDataSourceRow | null, EDatabase>;
	findByName: (name: string) => Effect.Effect<TDataSourceRow | null, EDatabase>;
	create: (
		input: TDataSourceCreateRowInput,
	) => Effect.Effect<TDataSourceRow, EDatabase>;
	update: (
		input: TDataSourceUpdateRowInput,
	) => Effect.Effect<TDataSourceRow | null, EDatabase>;
	remove: (id: string) => Effect.Effect<boolean, EDatabase>;
};

export type TDataSourceRepoId = TServiceId<typeof REPO_TAG.DATA_SOURCE>;

export const DataSourceRepo = Context.Service<
	TDataSourceRepoId,
	TDataSourceRepo
>(REPO_TAG.DATA_SOURCE);
