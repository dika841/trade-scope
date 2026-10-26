import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { CATALOG_MESSAGE } from "@app/messages";
import { catalogProductSearchSchema } from "@app/schemas";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useCatalogProduct } from "#/routes/_public/products/_hooks/use-catalog-product.ts";
import { MarketRankingCard } from "#/routes/_public/products/_components/market-ranking-card.tsx";
import { formatHsCode } from "#/routes/_public/search/_utils/format-hs-code.ts";

const ProductPage: FC = (): ReactElement => {
	const { hsCode } = Route.useParams();
	const { revision } = Route.useSearch();
	const product = useCatalogProduct({ hsCode, revision: revision ?? "" });

	if (!revision) {
		return (
			<div className="mx-auto w-full max-w-3xl px-6 py-12">
				<Card>
					<CardHeader>
						<CardTitle>{CATALOG_MESSAGE.CHOOSE_PRODUCT}</CardTitle>
						<CardDescription>
							{CATALOG_MESSAGE.CHOOSE_PRODUCT_BODY}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link
							to="/search"
							search={{ q: hsCode }}
							className="text-primary text-sm underline underline-offset-4"
						>
							{CATALOG_MESSAGE.BACK_TO_SEARCH}
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (product.isPending) {
		return (
			<div className="text-muted-foreground mx-auto flex w-full max-w-3xl items-center gap-2 px-6 py-12 text-sm">
				<Loader2 className="size-4 animate-spin" />
				{CATALOG_MESSAGE.SEARCHING}
			</div>
		);
	}

	if (product.isError || !product.data) {
		return (
			<div className="mx-auto w-full max-w-3xl px-6 py-12">
				<Card>
					<CardHeader>
						<CardTitle>{CATALOG_MESSAGE.NOT_FOUND_TITLE}</CardTitle>
						<CardDescription>{CATALOG_MESSAGE.NOT_FOUND_BODY}</CardDescription>
					</CardHeader>
					<CardContent>
						<Link
							to="/search"
							search={{ q: hsCode }}
							className="text-primary text-sm underline underline-offset-4"
						>
							{CATALOG_MESSAGE.BACK_TO_SEARCH}
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	const detail = product.data;

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
			<Link
				to="/search"
				search={{ q: formatHsCode(detail.hsCode) }}
				className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
			>
				<ArrowLeft className="size-4" />
				{CATALOG_MESSAGE.BACK_TO_SEARCH}
			</Link>

			<Card>
				<CardHeader>
					<CardDescription>{CATALOG_MESSAGE.PRODUCT_TITLE}</CardDescription>
					<CardTitle className="font-mono text-2xl">
						{formatHsCode(detail.hsCode)}
					</CardTitle>
					<p className="text-sm">{detail.description}</p>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					<div>
						<p className="text-muted-foreground text-xs uppercase">
							{CATALOG_MESSAGE.HS_REVISION}
						</p>
						<p className="text-sm">{detail.hsRevision}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs uppercase">
							{CATALOG_MESSAGE.LEVEL}
						</p>
						<p className="text-sm">{detail.level}</p>
					</div>
					{detail.parentHsCode ? (
						<div>
							<p className="text-muted-foreground text-xs uppercase">
								{CATALOG_MESSAGE.PARENT}
							</p>
							<p className="font-mono text-sm">
								{formatHsCode(detail.parentHsCode)}
							</p>
						</div>
					) : null}
					{detail.aliases.length > 0 ? (
						<div className="sm:col-span-2">
							<p className="text-muted-foreground text-xs uppercase">
								{CATALOG_MESSAGE.ALIASES}
							</p>
							<p className="text-sm">{detail.aliases.join(", ")}</p>
						</div>
					) : null}
				</CardContent>
			</Card>

			<MarketRankingCard hsCode={detail.hsCode} revision={detail.hsRevision} />
		</div>
	);
};

export const Route = createFileRoute("/_public/products/$hsCode/")({
	validateSearch: catalogProductSearchSchema,
	component: ProductPage,
});
