import { Effect } from "effect";
import { DbService, type TDbServiceId } from "#/platform/db/db-service.ts";
import { country, hsAlias, hsProduct } from "#/platform/db/tables/catalog.ts";

export type TCatalogSeedResult = {
	countries: number;
	products: number;
	aliases: number;
};

const COUNTRIES = [
	{ iso2: "ID", iso3: "IDN", name: "Indonesia" },
	{ iso2: "US", iso3: "USA", name: "United States" },
	{ iso2: "JP", iso3: "JPN", name: "Japan" },
	{ iso2: "SG", iso3: "SGP", name: "Singapore" },
	{ iso2: "NL", iso3: "NLD", name: "Netherlands" },
	{ iso2: "DE", iso3: "DEU", name: "Germany" },
] as const;

const HS_REVISION = "HS2022";
const SOURCE = "HS2022";

const PRODUCTS = [
	{
		hsCode: "090111",
		description: "Coffee, not roasted, not decaffeinated",
		parentHsCode: "0901",
		level: 6,
		aliases: ["green coffee", "coffee beans", "raw coffee"],
	},
	{
		hsCode: "090121",
		description: "Coffee, roasted, not decaffeinated",
		parentHsCode: "0901",
		level: 6,
		aliases: ["roasted coffee", "ground coffee", "coffee powder"],
	},
	{
		hsCode: "610910",
		description: "T-shirts, singlets and other vests, of cotton",
		parentHsCode: "6109",
		level: 6,
		aliases: ["t-shirt", "tshirt", "tee", "cotton shirt"],
	},
	{
		hsCode: "851713",
		description: "Smartphones",
		parentHsCode: "8517",
		level: 6,
		aliases: ["smartphone", "mobile phone", "cell phone"],
	},
	{
		hsCode: "151110",
		description: "Crude palm oil",
		parentHsCode: "1511",
		level: 6,
		aliases: ["cpo", "palm oil", "crude palm oil"],
	},
	{
		hsCode: "847130",
		description:
			"Portable automatic data processing machines, weighing not more than 10 kg",
		parentHsCode: "8471",
		level: 6,
		aliases: ["laptop", "notebook", "portable computer"],
	},
] as const;

export const catalogSeed = Effect.fn("catalogSeed")(
	function* (): Effect.fn.Return<TCatalogSeedResult, never, TDbServiceId> {
		const { db } = yield* DbService;

		return yield* Effect.promise(async (): Promise<TCatalogSeedResult> => {
			for (const item of COUNTRIES) {
				await db
					.insert(country)
					.values(item)
					.onConflictDoUpdate({
						target: country.iso2,
						set: {
							iso3: item.iso3,
							name: item.name,
							isActive: true,
							updatedAt: new Date(),
						},
					});
			}

			let aliases = 0;

			for (const item of PRODUCTS) {
				const [product] = await db
					.insert(hsProduct)
					.values({
						hsCode: item.hsCode,
						hsRevision: HS_REVISION,
						description: item.description,
						parentHsCode: item.parentHsCode,
						level: item.level,
						source: SOURCE,
					})
					.onConflictDoUpdate({
						target: [hsProduct.hsCode, hsProduct.hsRevision],
						set: {
							description: item.description,
							parentHsCode: item.parentHsCode,
							level: item.level,
							source: SOURCE,
							updatedAt: new Date(),
						},
					})
					.returning({ id: hsProduct.id });

				if (!product) {
					continue;
				}

				for (const alias of item.aliases) {
					const inserted = await db
						.insert(hsAlias)
						.values({
							alias,
							hsProductId: product.id,
							language: "en",
							source: SOURCE,
						})
						.onConflictDoNothing({
							target: [hsAlias.alias, hsAlias.hsProductId, hsAlias.language],
						})
						.returning({ id: hsAlias.id });

					aliases += inserted.length;
				}
			}

			return {
				countries: COUNTRIES.length,
				products: PRODUCTS.length,
				aliases,
			};
		});
	},
);
