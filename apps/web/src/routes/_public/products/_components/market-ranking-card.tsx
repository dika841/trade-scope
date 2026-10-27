import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@app/components/ui/table";
import { formatDate, formatDateTime, formatUsdCompact } from "@app/format";
import { MARKET_MESSAGE } from "@app/messages";
import type { TMarketItem } from "@app/schemas";
import { Download, Loader2 } from "lucide-react";
import { useState, type FC, type ReactElement } from "react";
import { downloadMarketCsv } from "#/libs/csv/market-csv.ts";
import { useProductMarkets } from "#/routes/_public/products/_hooks/use-product-markets.ts";

type TMarketRankingCardProps = {
	hsCode: string;
	revision: string;
	product: string;
};

const growthLabel = (value: number | null): string =>
	value === null
		? MARKET_MESSAGE.GROWTH_NEW
		: `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const growthClass = (value: number | null): string =>
	value === null
		? "text-muted-foreground"
		: value >= 0
			? "text-emerald-600"
			: "text-destructive";

const MarketRow: FC<{ item: TMarketItem; rank: number }> = (
	props,
): ReactElement => (
	<TableRow>
		<TableCell className="text-muted-foreground">{props.rank}</TableCell>
		<TableCell>
			<span className="font-medium">{props.item.importerName}</span>
			<span className="text-muted-foreground ml-2 font-mono text-xs">
				{props.item.importerIso2}
			</span>
		</TableCell>
		<TableCell className="text-right font-mono">
			{formatUsdCompact(props.item.valueUsd)}
		</TableCell>
		<TableCell
			className={`text-right font-mono ${growthClass(props.item.growthPercent)}`}
		>
			{growthLabel(props.item.growthPercent)}
		</TableCell>
		<TableCell className="text-right font-mono">
			{props.item.sharePercent.toFixed(1)}%
		</TableCell>
	</TableRow>
);

export const MarketRankingCard: FC<TMarketRankingCardProps> = (
	props,
): ReactElement => {
	const [periodYear, setPeriodYear] = useState<number | undefined>(undefined);
	const markets = useProductMarkets({
		hsCode: props.hsCode,
		revision: props.revision,
		periodYear,
	});

	if (markets.isPending) {
		return (
			<Card>
				<CardContent className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
					<Loader2 className="size-4 animate-spin" />
					{MARKET_MESSAGE.LOADING}
				</CardContent>
			</Card>
		);
	}

	if (markets.isError || !markets.data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{MARKET_MESSAGE.ERROR_TITLE}</CardTitle>
					<CardDescription>{MARKET_MESSAGE.ERROR_BODY}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const data = markets.data;

	if (data.periodYear === null) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{MARKET_MESSAGE.EMPTY_TITLE}</CardTitle>
					<CardDescription>{MARKET_MESSAGE.EMPTY_BODY}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{MARKET_MESSAGE.TITLE}</CardTitle>
				<CardDescription>{MARKET_MESSAGE.SUBTITLE}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm">
						<span>
							{MARKET_MESSAGE.PERIOD}: {data.periodYear}
						</span>
						<span>
							{MARKET_MESSAGE.TOTAL}: {formatUsdCompact(data.totalValueUsd)}
						</span>
						{data.previousPeriodYear !== null && (
							<span>
								{MARKET_MESSAGE.PREVIOUS_PERIOD}: {data.previousPeriodYear}
							</span>
						)}
						{data.lastImportedAt !== null && (
							<span>
								{MARKET_MESSAGE.UPDATED}: {formatDateTime(data.lastImportedAt)}
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						{data.availablePeriods.length > 1 && (
							<Select
								value={String(data.periodYear)}
								onValueChange={(value) => setPeriodYear(Number(value))}
							>
								<SelectTrigger
									className="w-28"
									aria-label={MARKET_MESSAGE.PERIOD}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{data.availablePeriods.map((year) => (
										<SelectItem key={year} value={String(year)}>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								downloadMarketCsv({
									hsCode: props.hsCode,
									hsRevision: props.revision,
									product: props.product,
									market: data,
								})
							}
						>
							<Download className="size-4" />
							{MARKET_MESSAGE.DOWNLOAD_CSV}
						</Button>
					</div>
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{MARKET_MESSAGE.COLUMN_RANK}</TableHead>
							<TableHead>{MARKET_MESSAGE.COLUMN_MARKET}</TableHead>
							<TableHead className="text-right">
								{MARKET_MESSAGE.COLUMN_VALUE}
							</TableHead>
							<TableHead className="text-right">
								{MARKET_MESSAGE.COLUMN_GROWTH}
							</TableHead>
							<TableHead className="text-right">
								{MARKET_MESSAGE.COLUMN_SHARE}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.items.map((item, index) => (
							<MarketRow key={item.importerIso2} item={item} rank={index + 1} />
						))}
					</TableBody>
				</Table>
				<div className="text-muted-foreground flex flex-col gap-1 text-xs">
					{data.provenance.map((entry) => (
						<p key={`${entry.source}:${entry.sourceUrl ?? ""}`}>
							{MARKET_MESSAGE.PROVENANCE}: {entry.source} ·{" "}
							{MARKET_MESSAGE.RETRIEVED}: {formatDate(entry.retrievedAt)}
							{entry.sourceUrl !== null && (
								<>
									{" · "}
									<a
										href={entry.sourceUrl}
										target="_blank"
										rel="noreferrer"
										className="underline underline-offset-4"
									>
										{MARKET_MESSAGE.VIEW_SOURCE}
									</a>
								</>
							)}
						</p>
					))}
				</div>
			</CardContent>
		</Card>
	);
};
