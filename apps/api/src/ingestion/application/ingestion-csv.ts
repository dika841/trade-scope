import { INGESTION_MESSAGE } from "@app/messages";
import { INGESTION_ERRORS_MAX, type TIngestionRowError } from "@app/schemas";
import type { TIngestionProduct } from "#/ingestion/domain/ingestion.ts";
import { A } from "@mobily/ts-belt";
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
const DESCRIPTION_MAX = 500;
const REVISION_PATTERN = /^[A-Za-z0-9._-]{1,20}$/;
const CODE_PATTERN = /^[0-9.\s]+$/;
const LANGUAGE_PATTERN = /^[a-z]{2}$/;
const ALIAS_MAX = 20;
const ALIAS_LENGTH_MAX = 100;
const LEVEL_MAX = 10;

const COLUMN = {
	HS_CODE: "hs_code",
	HS_REVISION: "hs_revision",
	DESCRIPTION: "description",
	PARENT_HS_CODE: "parent_hs_code",
	LEVEL: "level",
	ALIASES: "aliases",
	LANGUAGE: "language",
	VALID_FROM: "valid_from",
	VALID_TO: "valid_to",
} as const;

const REQUIRED_COLUMNS: readonly string[] = [
	COLUMN.HS_CODE,
	COLUMN.HS_REVISION,
	COLUMN.DESCRIPTION,
];

const ALLOWED_COLUMNS: readonly string[] = [
	...REQUIRED_COLUMNS,
	COLUMN.PARENT_HS_CODE,
	COLUMN.LEVEL,
	COLUMN.ALIASES,
	COLUMN.LANGUAGE,
	COLUMN.VALID_FROM,
	COLUMN.VALID_TO,
];

type TIngestionParsed = {
	totalRows: number;
	products: readonly TIngestionProduct[];
	failures: readonly TIngestionRowError[];
};

const aliasesOf = (value: string): readonly string[] => {
	const seen = new Set<string>();
	const aliases = A.filterMap(
		value.split(/[|;]/),
		(item): string | undefined => {
			const trimmed = item.trim();

			if (trimmed === "" || seen.has(trimmed)) {
				return undefined;
			}

			seen.add(trimmed);
			return trimmed;
		},
	);

	return aliases;
};

type TRowDecoded =
	| { ok: true; product: TIngestionProduct }
	| { ok: false; message: string };

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

	const description = cellOf(row, columns, COLUMN.DESCRIPTION).trim();

	if (description.length === 0 || description.length > DESCRIPTION_MAX) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_DESCRIPTION };
	}

	const rawParent = cellOf(row, columns, COLUMN.PARENT_HS_CODE).trim();
	const parentValid =
		rawParent === "" ||
		(CODE_PATTERN.test(rawParent) &&
			digitsOf(rawParent).length >= CODE_MIN_DIGITS);

	if (!parentValid) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_CODE };
	}

	const rawLevel = cellOf(row, columns, COLUMN.LEVEL).trim();
	const level =
		rawLevel === "" ? Math.min(code.length, LEVEL_MAX) : Number(rawLevel);

	if (!Number.isInteger(level) || level < 1 || level > LEVEL_MAX) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_LEVEL };
	}

	const language = cellOf(row, columns, COLUMN.LANGUAGE).trim() || "en";

	if (!LANGUAGE_PATTERN.test(language)) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_LANGUAGE };
	}

	const aliases = aliasesOf(cellOf(row, columns, COLUMN.ALIASES));

	if (
		aliases.length > ALIAS_MAX ||
		A.some(aliases, (alias) => alias.length > ALIAS_LENGTH_MAX)
	) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_ALIAS };
	}

	const rawValidFrom = cellOf(row, columns, COLUMN.VALID_FROM).trim();
	const rawValidTo = cellOf(row, columns, COLUMN.VALID_TO).trim();

	if (
		(rawValidFrom !== "" && !dateValid(rawValidFrom)) ||
		(rawValidTo !== "" && !dateValid(rawValidTo))
	) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_DATE };
	}

	if (rawValidFrom !== "" && rawValidTo !== "" && rawValidFrom > rawValidTo) {
		return { ok: false, message: INGESTION_MESSAGE.INVALID_RANGE };
	}

	return {
		ok: true,
		product: {
			hsCode: code,
			hsRevision: revision,
			description,
			parentHsCode: rawParent === "" ? null : digitsOf(rawParent),
			level,
			aliases,
			language,
			validFrom: rawValidFrom === "" ? null : rawValidFrom,
			validTo: rawValidTo === "" ? null : rawValidTo,
		},
	};
};

export const ingestionCsvParse = (text: string): TIngestionParsed => {
	const rows = csvRowsParse(text);
	const [header, ...body] = rows;

	if (header === undefined) {
		throw headerInvalid(INGESTION_MESSAGE.INVALID_HEADER);
	}

	const columns = columnsOf(
		header,
		REQUIRED_COLUMNS,
		ALLOWED_COLUMNS,
		INGESTION_MESSAGE.INVALID_HEADER,
	);

	if (body.length > ROWS_MAX) {
		throw new EBadRequest({ message: INGESTION_MESSAGE.ROWS_TOO_MANY });
	}

	const products: TIngestionProduct[] = [];
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

		const key = `${decoded.product.hsCode}:${decoded.product.hsRevision}`;

		if (seen.has(key)) {
			failures.push({
				row: rowNumber,
				message: INGESTION_MESSAGE.DUPLICATE_ROW,
			});
			continue;
		}

		seen.add(key);
		products.push(decoded.product);
	}

	return {
		totalRows,
		products,
		failures: failures.slice(0, INGESTION_ERRORS_MAX),
	};
};
