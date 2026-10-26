import { dataSourceRepoLayer } from "#/data-source/infrastructure/data-source-repository.ts";
import { dataSourceRouterBuild } from "#/data-source/presentation/data-source-router.ts";

export const dataSourceModule: {
	layer: typeof dataSourceRepoLayer;
	routerBuild: typeof dataSourceRouterBuild;
} = {
	layer: dataSourceRepoLayer,
	routerBuild: dataSourceRouterBuild,
};
