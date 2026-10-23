import type { TCatalogProductInput } from "@app/schemas";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "#/libs/orpc/client.ts";

export const useCatalogProduct = (input: TCatalogProductInput) =>
	useQuery({
		...orpc.catalog.get.queryOptions({ input }),
		enabled: input.revision.length > 0,
	});
