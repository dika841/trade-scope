import type { TMarketDemand } from "@app/schemas";

type TCsvValue = string | number | null;

type TMarketCsvContext = {
	title?: string;
	hsCode: string;
	hsRevision: string;
	product: string;
	market: TMarketDemand;
};

const csvCell = (value: TCsvValue): string => {
	if (value === null || value === "") {
		return "";
	}

	if (typeof value === "number") {
		return String(value);
	}

	const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
	return `"${safe.replaceAll('"', '""')}"`;
};

const download = (fileName: string, rows: readonly TCsvValue[][]): void => {
	const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
	const blob = new Blob([`\uFEFF${content}`], {
		type: "text/csv;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	anchor.click();
	URL.revokeObjectURL(url);
};

const HEADER: readonly string[] = [
	"report_title",
	"hs_code",
	"hs_revision",
	"product",
	"period_year",
	"rank",
	"importer_iso2",
	"importer_name",
	"value_usd",
	"previous_value_usd",
	"growth_percent",
	"share_percent",
	"source",
	"source_url",
	"retrieved_at",
	"data_updated_at",
];

export const downloadMarketCsv = (context: TMarketCsvContext): void => {
	const { market } = context;
	const sources = market.provenance.map((entry) => entry.source).join("; ");
	const urls = market.provenance
		.map((entry) => entry.sourceUrl)
		.filter((url): url is string => url !== null)
		.join("; ");
	const retrieved = market.provenance
		.map((entry) => entry.retrievedAt)
		.join("; ");

	const rows: TCsvValue[][] = [
		[...HEADER],
		...market.items.map((item, index) => [
			context.title ?? "",
			context.hsCode,
			context.hsRevision,
			context.product,
			market.periodYear,
			index + 1,
			item.importerIso2,
			item.importerName,
			item.valueUsd,
			item.previousValueUsd,
			item.growthPercent,
			item.sharePercent,
			sources,
			urls,
			retrieved,
			market.lastImportedAt,
		]),
	];

	download(
		`trade-scope-${context.hsCode}-${market.periodYear ?? "no-period"}.csv`,
		rows,
	);
};
