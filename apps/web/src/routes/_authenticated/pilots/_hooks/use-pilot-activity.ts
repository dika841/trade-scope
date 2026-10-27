import { usePermissions } from "@app/components/guard/use-permissions";
import { PERMISSION } from "@app/permissions";
import { ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "#/libs/orpc/client.ts";

const PAGE_SIZE = 20;

export const usePilotActivity = (pilotId: string) => {
	const { canAll } = usePermissions();
	const input = {
		page: 1,
		pageSize: PAGE_SIZE,
		resourceType: ACTIVITY_RESOURCE_TYPE.PILOT,
		resourceId: pilotId,
	};

	return useQuery({
		...orpc.activity.list.queryOptions({ input }),
		enabled: canAll([PERMISSION.ACTIVITY_READ]),
	});
};
