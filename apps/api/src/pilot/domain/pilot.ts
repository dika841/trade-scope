import type {
	TPilotCreateInput,
	TPilotListInput,
	TPilotStatus,
	TPilotUpdateInput,
} from "@app/schemas";
import { Context, type Effect } from "effect";
import type { EDatabase } from "#/shared/errors.ts";
import type { TRowPage } from "#/shared/pagination.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { REPO_TAG } from "#/shared/repo-tags.ts";

export type TPilotRow = {
	id: string;
	hsCode: string;
	hsRevision: string;
	productDescription: string;
	marketIso2: string;
	marketName: string;
	status: TPilotStatus;
	ownerId: string | null;
	ownerName: string | null;
	ownerEmail: string | null;
	notes: string | null;
	createdBy: string | null;
	createdByEmail: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type TPilotOwnerRow = {
	id: string;
	name: string;
	email: string;
};

export type TPilotMarketRow = {
	iso2: string;
	name: string;
};

export type TPilotCreateRowInput = TPilotCreateInput & {
	createdBy: string;
};

export type TPilotUpdateRowInput = TPilotUpdateInput;

export type TPilotRepo = {
	list: (
		input: TPilotListInput,
	) => Effect.Effect<TRowPage<TPilotRow>, EDatabase>;
	getById: (id: string) => Effect.Effect<TPilotRow | null, EDatabase>;
	listForProduct: (
		hsCode: string,
		hsRevision: string,
	) => Effect.Effect<readonly TPilotRow[], EDatabase>;
	create: (input: TPilotCreateRowInput) => Effect.Effect<TPilotRow, EDatabase>;
	update: (
		input: TPilotUpdateRowInput,
	) => Effect.Effect<TPilotRow | null, EDatabase>;
	findProduct: (
		hsCode: string,
		hsRevision: string,
	) => Effect.Effect<{ hsCode: string; hsRevision: string } | null, EDatabase>;
	findMarket: (
		iso2: string,
	) => Effect.Effect<TPilotMarketRow | null, EDatabase>;
	findOwner: (id: string) => Effect.Effect<TPilotOwnerRow | null, EDatabase>;
	listOwners: () => Effect.Effect<readonly TPilotOwnerRow[], EDatabase>;
	listMarkets: () => Effect.Effect<readonly TPilotMarketRow[], EDatabase>;
};

export type TPilotRepoId = TServiceId<typeof REPO_TAG.PILOT>;

export const PilotRepo = Context.Service<TPilotRepoId, TPilotRepo>(
	REPO_TAG.PILOT,
);
