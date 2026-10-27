import { pilotRepoLayer } from "#/pilot/infrastructure/pilot-repository.ts";
import { pilotRouterBuild } from "#/pilot/presentation/pilot-router.ts";

export { PilotRepo } from "#/pilot/domain/pilot.ts";
export type { TPilotRepoId } from "#/pilot/domain/pilot.ts";

export const pilotModule: {
	layer: typeof pilotRepoLayer;
	routerBuild: typeof pilotRouterBuild;
} = {
	layer: pilotRepoLayer,
	routerBuild: pilotRouterBuild,
};
