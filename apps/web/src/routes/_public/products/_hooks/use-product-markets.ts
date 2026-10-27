import { MARKET_DEFAULT_LIMIT } from "@app/schemas";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "#/libs/orpc/client.ts";

type TProductMarketsInput = {
	hsCode: string;
	revision: string;
	periodYear?: number;
};

export const useProductMarkets = (input: TProductMarketsInput) =>
	useQuery({
		...orpc.market.get.queryOptions({
			input: { ...input, limit: MARKET_DEFAULT_LIMIT },
		}),
		enabled: input.revision.length > 0,
	});
