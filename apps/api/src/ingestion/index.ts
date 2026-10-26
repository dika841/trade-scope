import { Layer } from "effect";
import { ingestionProcess } from "#/ingestion/application/ingestion-process.ts";
import { ingestionRepoLayer } from "#/ingestion/infrastructure/ingestion-repository.ts";
import { ingestionQueueLayer } from "#/ingestion/infrastructure/ingestion-queue.ts";
import { ingestionRouterBuild } from "#/ingestion/presentation/ingestion-router.ts";

const ingestionLayer = Layer.mergeAll(ingestionRepoLayer, ingestionQueueLayer);

export { ingestionProcess };
export type { TIngestionJobPayload } from "#/ingestion/infrastructure/ingestion-queue.ts";

export const ingestionModule: {
	layer: typeof ingestionLayer;
	routerBuild: typeof ingestionRouterBuild;
	process: typeof ingestionProcess;
} = {
	layer: ingestionLayer,
	routerBuild: ingestionRouterBuild,
	process: ingestionProcess,
};
