import type { TActivityAction, TActivityResourceType } from "./actions.ts";

export type TActivityMetadataValue = string | number | boolean | null;

export type TActivityMetadata = Readonly<
	Record<string, TActivityMetadataValue>
>;

export type TActivityEntry = {
	actorId: string | null;
	action: TActivityAction;
	resourceType: TActivityResourceType;
	resourceId: string;
	metadata?: TActivityMetadata;
};

export type TActivityRepo = {
	insert: (entry: TActivityEntry) => Promise<void>;
};
