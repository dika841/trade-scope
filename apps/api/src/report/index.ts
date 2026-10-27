import { reportRepoLayer } from "#/report/infrastructure/report-repository.ts";
import { reportRouterBuild } from "#/report/presentation/report-router.ts";

export const reportModule: {
	layer: typeof reportRepoLayer;
	routerBuild: typeof reportRouterBuild;
} = {
	layer: reportRepoLayer,
	routerBuild: reportRouterBuild,
};
