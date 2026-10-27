import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@app/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@app/components/ui/table";
import { formatDate, formatDateTime, formatUsdCompact } from "@app/format";
import {
	MARKET_MESSAGE,
	PILOT_STATUS_LABEL,
	REPORT_MESSAGE,
} from "@app/messages";
import type { TSharedReport } from "@app/schemas";
import type { FC, ReactElement } from "react";
import { formatHsCode } from "#/routes/_public/search/_utils/format-hs-code.ts";

type TReportPreviewProps = {
	report: TSharedReport;
};

export const ReportPreview: FC<TReportPreviewProps> = (props): ReactElement => {
	const { market, pilots } = props.report.payload;

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardDescription>{REPORT_MESSAGE.TITLE}</CardDescription>
					<CardTitle className="text-2xl">{props.report.title}</CardTitle>
					<p className="text-sm">
						{formatHsCode(props.report.hsCode)} · {props.report.hsRevision} ·{" "}
						{props.report.productDescription}
					</p>
					<p className="text-muted-foreground text-xs">
						{REPORT_MESSAGE.GENERATED_AT}: {formatDate(props.report.createdAt)}
					</p>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{REPORT_MESSAGE.MARKET_TITLE}</CardTitle>
					{market.periodYear === null ? (
						<CardDescription>{REPORT_MESSAGE.MARKET_EMPTY}</CardDescription>
					) : (
						<CardDescription>
							{REPORT_MESSAGE.PERIOD}: {market.periodYear} ·{" "}
							{REPORT_MESSAGE.TOTAL}: {formatUsdCompact(market.totalValueUsd)}
						</CardDescription>
					)}
				</CardHeader>
				{market.periodYear !== null && (
					<CardContent className="flex flex-col gap-4">
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
								{market.items.map((item, index) => (
									<TableRow key={item.importerIso2}>
										<TableCell className="text-muted-foreground">
											{index + 1}
										</TableCell>
										<TableCell>
											{item.importerName} ({item.importerIso2})
										</TableCell>
										<TableCell className="text-right font-mono">
											{formatUsdCompact(item.valueUsd)}
										</TableCell>
										<TableCell className="text-right font-mono">
											{item.growthPercent === null
												? MARKET_MESSAGE.GROWTH_NEW
												: `${item.growthPercent > 0 ? "+" : ""}${item.growthPercent.toFixed(1)}%`}
										</TableCell>
										<TableCell className="text-right font-mono">
											{item.sharePercent.toFixed(1)}%
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<div className="text-muted-foreground flex flex-col gap-1 text-xs">
							{market.provenance.map((entry) => (
								<p key={`${entry.source}:${entry.sourceUrl ?? ""}`}>
									{REPORT_MESSAGE.PROVENANCE}: {entry.source} ·{" "}
									{REPORT_MESSAGE.RETRIEVED}: {formatDate(entry.retrievedAt)}
								</p>
							))}
						</div>
					</CardContent>
				)}
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{REPORT_MESSAGE.PILOTS_TITLE}</CardTitle>
					{pilots.length === 0 && (
						<CardDescription>{REPORT_MESSAGE.PILOTS_EMPTY}</CardDescription>
					)}
				</CardHeader>
				{pilots.length > 0 && (
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{REPORT_MESSAGE.PILOTS_COLUMN_MARKET}</TableHead>
									<TableHead>{REPORT_MESSAGE.PILOTS_COLUMN_STATUS}</TableHead>
									<TableHead className="text-right">
										{REPORT_MESSAGE.PILOTS_COLUMN_UPDATED}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pilots.map((pilot) => (
									<TableRow key={pilot.id}>
										<TableCell>
											{pilot.marketName} ({pilot.marketIso2})
										</TableCell>
										<TableCell>{PILOT_STATUS_LABEL[pilot.status]}</TableCell>
										<TableCell className="text-right text-muted-foreground">
											{formatDateTime(pilot.updatedAt)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				)}
			</Card>
		</div>
	);
};
