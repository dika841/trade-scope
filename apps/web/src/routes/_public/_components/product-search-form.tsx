import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { CATALOG_MESSAGE } from "@app/messages";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import type { FC, FormEvent, ReactElement } from "react";
import { useState } from "react";

type TProductSearchFormProps = {
	initialQuery?: string | undefined;
};

export const ProductSearchForm: FC<TProductSearchFormProps> = (
	props,
): ReactElement => {
	const navigate = useNavigate();
	const [query, setQuery] = useState(props.initialQuery ?? "");

	const onSubmit = (event: FormEvent): void => {
		event.preventDefault();
		const value = query.trim();

		void navigate({
			to: "/search",
			search: { q: value.length > 0 ? value : undefined },
		});
	};

	return (
		<form
			onSubmit={onSubmit}
			className="flex w-full flex-col gap-2 sm:flex-row"
		>
			<label htmlFor="catalog-search" className="sr-only">
				{CATALOG_MESSAGE.SEARCH_LABEL}
			</label>
			<Input
				id="catalog-search"
				name="q"
				type="search"
				autoComplete="off"
				value={query}
				placeholder={CATALOG_MESSAGE.SEARCH_PLACEHOLDER}
				onChange={(event) => setQuery(event.target.value)}
				className="h-11 text-base sm:flex-1"
			/>
			<Button type="submit" size="lg" className="h-11">
				<Search className="size-4" />
				{CATALOG_MESSAGE.SEARCH_ACTION}
			</Button>
		</form>
	);
};
