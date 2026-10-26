import { INGESTION_MESSAGE } from "@app/messages";
import { INGESTION_ERRORS_MAX, type TIngestionRowError } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import type { TIngestionTrade } from "#/ingestion/domain/ingestion.ts";
import {
	cellOf,
	columnsOf,
	csvRowsParse,
	dateValid,
	digitsOf,
	headerInvalid,
	type TColumnIndex,
} from "#/ingestion/application/ingestion-csv-shared.ts";
import { EBadRequest } from "#/shared/errors.ts";

const ROWS_MAX = 20_000;
const CODE_MAX_DIGITS = 12;
const CODE_MIN_DIGITS = 2;
const REVISION_PATTERN = /^[A-Za-z0-9._-]{1,20}$/;
const CODE_PATTERN = /^[0-9.\s]+$/;
const IMPORTER_PATTERN = /^[A-Za-z]{2}$/;
const NUMBER_PATTERN = /^\d+(\.\d+)?$/;
const URL_MAX = 2048;
const SOURCE_MAX = 100;
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

const COLUMN = {
	HS_CODE: "hs_code",
	HS_REVISION: "hs_revision",
	IMPORTER_ISO2: "importer_iso2",
	YEAR: "year",
	TRADE_VALUE_USD: "trade_value_usd",
	QUANTITY_KG: "quantity_kg",
	SOURCE: "source",
	SOURCE_URL: "source_url",
	RETRIEVED_AT: "retrieved_at",
} as const;

const REQUIRED_COLUMNS: readonly string[] = [
	COLUMN.HS_CODE,
	COLUMN.HS_REVISION,
	COLUMN.IMPORTER_ISO2,
	COLUMN.YEAR,
	COLUMN.TRADE_VALUE_USD,
	COLUMN.SOURCE,
];

const ALLOWED_COLUMNS: readonly string[] = [
	...REQUIRED_COLUMNS,
	COLUMN.QUANTITY_KG,
	COLUMN.SOURCE_URL,
	COLUMN.RETRIEVED_AT,
];

export type TIngestionTradeParsed = {
	totalRows: number;
	trades: readonly TIngestionTrade[];
	failures: readonly TIngestionRowError[];
};

type TRowDecoded =
	| { ok: true; trade: TIngestionTrade }
	| { ok: false; message: string };

const numberOf = (value: string): number | null => {
	if (!NUMBER_PATTERN.test(value)) {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const urlValid = (value: string): boolean => {
	if (value.length > URL_MAX) {
		return false;
	}

	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};

const timestampValid = (value: string): boolean =>
	dateValid(value) ||
	(value.includes("T") && Number.isFinite(new Date(value).getTime()));

const rowDecode = (
	row: readonly string[],
	columns: TColumnIndex,
): TRowDecoded => {
	const rawCode = cellOf(row, columns, COLUMN.HS_CODE).trim();
	const code = digitsOf(rawCode);

	if (
		!CODE_PATTERN.test(rawCode) ||
		code.length < CODE_MIN_DIGITS ||
		code.length > CODE_MAX_DIGITS
	) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_CODE };
	}

	const revision = cellOf(row, columns, COLUMN.HS_REVISION).trim();

	if (!REVISION_PATTERN.test(revision)) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_REVISION };
	}

	const rawImporter = cellOf(row, columns, COLUMN.IMPORTER_ISO2).trim();

	if (!IMPORTER_PATTERN.test(rawImporter)) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_IMPORTER };
	}

	const rawYear = cellOf(row, columns, COLUMN.YEAR).trim();
	const periodYear = Number(rawYear);

	if (
		!Number.isInteger(periodYear) ||
		periodYear < YEAR_MIN ||
		periodYear > YEAR_MAX
	) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_YEAR };
	}

	const tradeValueUsd = numberOf(
		cellOf(row, columns, COLUMN.TRADE_VALUE_USD).trim(),
	);

	if (tradeValueUsd === null) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_TRADE_VALUE };
	}

	const rawQuantity = cellOf(row, columns, COLUMN.QUANTITY_KG).trim();
	const quantityKg = rawQuantity === "" ? null : numberOf(rawQuantity);

	if (rawQuantity !== "" && quantityKg === null) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_QUANTITY };
	}

	const source = cellOf(row, columns, COLUMN.SOURCE).trim();

	if (source.length === 0 || source.length > SOURCE_MAX) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_SOURCE };
	}

	const rawUrl = cellOf(row, columns, COLUMN.SOURCE_URL).trim();
	const sourceUrl = rawUrl === "" ? null : rawUrl;

	if (sourceUrl !== null && !urlValid(sourceUrl)) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_SOURCE_URL };
	}

	const rawRetrievedAt = cellOf(row, columns, COLUMN.RETRIEVED_AT).trim();

	if (rawRetrievedAt !== "" && !timestampValid(rawRetrievedAt)) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_RETRIEVED_AT };
	}

	return {
		ok: true,
		trade: {
			hsCode: code,
			hsRevision: revision,
			importerIso2: rawImporter.toUpperCase(),
			periodYear,
			tradeValueUsd,
			quantityKg,
			source,
			sourceUrl,
			retrievedAt:
				rawRetrievedAt === "" ? null : new Date(rawRetrievedAt).toISOString(),
		},
	};
};

export const ingestionTradeCsvParse = (text: string): TIngestionTradeParsed => {
	const rows = csvRowsParse(text);
	const [header, ...body] = rows;

	if (header === undefined) {
		throw headerInvalid(INGESTION_MESSAGE.INVALID_TRADE_HEADER);
	}

	const columns = columnsOf(
		header,
		REQUIRED_COLUMNS,
		ALLOWED_COLUMNS,
		INGESTION_MESSAGE.INVALID_TRADE_HEADER,
	);

	if (body.length > ROWS_MAX) {
		throw new EBadRequest({ message: INGESTION_MESSAGE.ROWS_TOO_MANY });
	}

	const trades: TIngestionTrade[] = [];
	const failures: TIngestionRowError[] = [];
	const seen = new Set<string>();
	let totalRows = 0;

	for (let position = 0; position < body.length; position += 1) {
		const row = body[position];

		if (row === undefined || A.every(row, (value) => value.trim() === "")) {
			continue;
		}

		totalRows += 1;
		const rowNumber = position + 2;
		const decoded = rowDecode(row, columns);

		if (!decoded.ok) {
			failures.push({ row: rowNumber, message: decoded.message });
			continue;
		}

		const key = `${decoded.trade.hsCode}:${decoded.trade.hsRevision}:${decoded.trade.importerIso2}:${decoded.trade.periodYear}`;

		if (seen.has(key)) {
			failures.push({
				row: rowNumber,
				message: INGESTION_MESSAGE.DUPLICATE_TRADE_ROW,
			});
			continue;
		}

		seen.add(key);
		trades.push(decoded.trade);
	}

	return {
		totalRows,
		trades,
		failures: failures.slice(0, INGESTION_ERRORS_MAX),
	};
};
