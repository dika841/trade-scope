import { CATALOG_MESSAGE, PILOT_MESSAGE } from "@app/messages";
import type { TCatalogProduct } from "@app/schemas";
import { Loader2 } from "lucide-react";
import { useState, type FC, type ReactElement } from "react";
import { Input } from "@app/components/ui/input";
import { useCatalogSearch } from "#/routes/_public/search/_hooks/use-catalog-search.ts";
import { formatHsCode } from "#/routes/_public/search/_utils/format-hs-code.ts";

type TProductPickerProps = {
	selectedLabel: string;
	onSelect: (product: TCatalogProduct) => void;
	onClear: () => void;
};

export const ProductPicker: FC<TProductPickerProps> = (props): ReactElement => {
	const [query, setQuery] = useState("");
	const search = useCatalogSearch(query.trim());

	if (props.selectedLabel !== "") {
		return (
			<div className="flex flex-col gap-2 rounded-md border p-3">
				<span className="text-sm font-medium">{props.selectedLabel}</span>
				<button
					type="button"
					className="text-muted-foreground w-fit text-xs underline underline-offset-4"
					onClick={() => {
						props.onClear();
						setQuery("");
					}}
				>
					{PILOT_MESSAGE.CHANGE_PRODUCT}
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<Input
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				placeholder={PILOT_MESSAGE.PRODUCT_PLACEHOLDER}
				aria-label={PILOT_MESSAGE.FIELD_PRODUCT}
			/>
			{query.trim().length >= 2 && (
				<div className="flex flex-col rounded-md border">
					{search.isPending && (
						<span className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
							<Loader2 className="size-4 animate-spin" />
							{CATALOG_MESSAGE.SEARCHING}
						</span>
					)}
					{search.isError && (
						<span className="text-destructive p-3 text-sm">
							{CATALOG_MESSAGE.ERROR_BODY}
						</span>
					)}
					{search.data?.items.length === 0 && !search.isPending && (
						<span className="text-muted-foreground p-3 text-sm">
							{PILOT_MESSAGE.PRODUCT_EMPTY}
						</span>
					)}
					{search.data?.items.map((product) => (
						<button
							key={`${product.hsCode}:${product.hsRevision}`}
							type="button"
							className="hover:bg-accent flex flex-col items-start gap-1 border-b p-3 text-left last:border-b-0"
							onClick={() => {
								props.onSelect(product);
								setQuery("");
							}}
						>
							<span className="font-mono text-sm">
								{formatHsCode(product.hsCode)}
							</span>
							<span className="text-muted-foreground text-sm">
								{product.description}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};
