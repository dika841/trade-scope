import { CATALOG_SEARCH_DEFAULT_LIMIT } from "@app/schemas";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "#/libs/orpc/client.ts";

export const useCatalogSearch = (query: string | undefined) => {
	const input = {
		q: query?.trim() ?? "",
		limit: CATALOG_SEARCH_DEFAULT_LIMIT,
	};

	return useQuery({
		...orpc.catalog.search.queryOptions({ input }),
		enabled: input.q.length >= 2,
	});
};
