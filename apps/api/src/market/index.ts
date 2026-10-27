import { marketRepoLayer } from "#/market/infrastructure/market-repository.ts";
import { marketRouterBuild } from "#/market/presentation/market-router.ts";

export { marketGet } from "#/market/application/market-get.ts";
export type { TMarketRepoId } from "#/market/domain/market.ts";

export const marketModule: {
	layer: typeof marketRepoLayer;
	routerBuild: typeof marketRouterBuild;
} = {
	layer: marketRepoLayer,
	routerBuild: marketRouterBuild,
};
