import { marketRepoLayer } from "#/market/infrastructure/market-repository.ts";
import { marketRouterBuild } from "#/market/presentation/market-router.ts";

export const marketModule: {
	layer: typeof marketRepoLayer;
	routerBuild: typeof marketRouterBuild;
} = {
	layer: marketRepoLayer,
	routerBuild: marketRouterBuild,
};
