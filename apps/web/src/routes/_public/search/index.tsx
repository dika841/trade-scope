import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import { CATALOG_MESSAGE } from "@app/messages";
import { catalogSearchParamsSchema } from "@app/schemas";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, SearchX } from "lucide-react";
import type { FC, ReactElement } from "react";
import { ProductSearchForm } from "#/routes/_public/_components/product-search-form.tsx";
import { useCatalogSearch } from "#/routes/_public/search/_hooks/use-catalog-search.ts";
import { formatHsCode } from "#/routes/_public/search/_utils/format-hs-code.ts";

const SearchPage: FC = (): ReactElement => {
	const { q } = Route.useSearch();
	const query = q?.trim() ?? "";
	const search = useCatalogSearch(query);

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:py-16">
			<div className="flex flex-col gap-3">
				<h1 className="text-3xl font-semibold tracking-tight">
					{CATALOG_MESSAGE.TITLE}
				</h1>
				<p className="text-muted-foreground max-w-2xl">
					{CATALOG_MESSAGE.SUBTITLE}
				</p>
			</div>

			<ProductSearchForm initialQuery={query} />

			{query.length < 2 ? (
				<p className="text-muted-foreground text-sm">
					{CATALOG_MESSAGE.SEARCH_HINT}
				</p>
			) : null}

			{query.length >= 2 && search.isPending ? (
				<output className="text-muted-foreground flex items-center gap-2 text-sm">
					<Loader2 className="size-4 animate-spin" />
					{CATALOG_MESSAGE.SEARCHING}
				</output>
			) : null}

			{search.isError ? (
				<Card>
					<CardHeader>
						<CardTitle>{CATALOG_MESSAGE.ERROR_TITLE}</CardTitle>
					</CardHeader>
					<CardContent className="text-muted-foreground text-sm">
						{CATALOG_MESSAGE.ERROR_BODY}
					</CardContent>
				</Card>
			) : null}

			{search.data && search.data.items.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<SearchX className="size-4" />
							{CATALOG_MESSAGE.EMPTY_TITLE}
						</CardTitle>
					</CardHeader>
					<CardContent className="text-muted-foreground text-sm">
						{CATALOG_MESSAGE.EMPTY_BODY}
					</CardContent>
				</Card>
			) : null}

			{search.data && search.data.items.length > 0 ? (
				<section
					aria-live="polite"
					className="flex flex-col gap-4"
					aria-label={CATALOG_MESSAGE.RESULTS_TITLE}
				>
					<div className="flex items-center justify-between gap-4">
						<h2 className="font-medium">{CATALOG_MESSAGE.RESULTS_TITLE}</h2>
						<p className="text-muted-foreground text-sm">
							{search.data.items.length} {CATALOG_MESSAGE.RESULTS_COUNT}
						</p>
					</div>

					{search.data.ambiguous ? (
						<p
							role="status"
							className="border-amber-500/40 bg-amber-500/10 rounded-md border p-3 text-sm"
						>
							{CATALOG_MESSAGE.AMBIGUOUS}
						</p>
					) : null}

					<ul className="flex flex-col gap-3">
						{search.data.items.map((item) => (
							<li key={item.id}>
								<Link
									to="/products/$hsCode"
									params={{ hsCode: item.hsCode }}
									search={{ revision: item.hsRevision }}
									className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<Card className="transition-colors hover:bg-accent/40">
										<CardHeader>
											<div className="flex flex-wrap items-center gap-2">
												<CardTitle className="font-mono text-base">
													{formatHsCode(item.hsCode)}
												</CardTitle>
												<span className="text-muted-foreground text-xs">
													{item.hsRevision} · level {item.level}
												</span>
											</div>
										</CardHeader>
										<CardContent>
											<p className="text-sm">{item.description}</p>
										</CardContent>
									</Card>
								</Link>
							</li>
						))}
					</ul>

					{search.data.hasMore ? (
						<p className="text-muted-foreground text-sm">
							{CATALOG_MESSAGE.HAS_MORE}
						</p>
					) : null}
				</section>
			) : null}
		</div>
	);
};

export const Route = createFileRoute("/_public/search/")({
	validateSearch: catalogSearchParamsSchema,
	component: SearchPage,
});
