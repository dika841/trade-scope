import { catalogRepoLayer } from "#/catalog/infrastructure/catalog-repository.ts";
import { catalogRouterBuild } from "#/catalog/presentation/catalog-router.ts";

export { catalogGet } from "#/catalog/application/catalog-get.ts";
export type { TCatalogRepoId } from "#/catalog/domain/catalog.ts";

export const catalogModule: {
	layer: typeof catalogRepoLayer;
	routerBuild: typeof catalogRouterBuild;
} = {
	layer: catalogRepoLayer,
	routerBuild: catalogRouterBuild,
};
