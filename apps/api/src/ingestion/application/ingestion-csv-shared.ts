import { INGESTION_MESSAGE } from "@app/messages";
import { A } from "@mobily/ts-belt";
import { EBadRequest } from "#/shared/errors.ts";

export type TColumnIndex = Readonly<Record<string, number>>;

export const headerInvalid = (message: string): EBadRequest =>
	new EBadRequest({ message });

export const unclosedQuote = (): EBadRequest =>
	new EBadRequest({ message: INGESTION_MESSAGE.UNCLOSED_QUOTE });

export const csvRowsParse = (text: string): string[][] => {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let quoted = false;
	const source = text.startsWith("\uFEFF") ? text.slice(1) : text;

	for (let index = 0; index < source.length; index += 1) {
		const char = source[index];

		if (quoted) {
			if (char === '"') {
				if (source[index + 1] === '"') {
					field += '"';
					index += 1;
				} else {
					quoted = false;
				}
			} else {
				field += char;
			}
		} else if (char === '"' && field === "") {
			quoted = true;
		} else if (char === ",") {
			row.push(field);
			field = "";
		} else if (char === "\n") {
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else if (char !== "\r") {
			field += char;
		}
	}

	if (quoted) {
		throw unclosedQuote();
	}

	if (field !== "" || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows;
};

export const columnsOf = (
	header: readonly string[],
	requiredColumns: readonly string[],
	allowedColumns: readonly string[],
	message: string,
): TColumnIndex => {
	const normalized = A.map(header, (value) => value.trim().toLowerCase());
	const supported = A.every(
		normalized,
		(value) => value === "" || A.includes(allowedColumns, value),
	);
	const unique = new Set(normalized);

	if (
		!supported ||
		unique.size !== normalized.length ||
		!A.every(requiredColumns, (value) => unique.has(value))
	) {
		throw headerInvalid(message);
	}

	const index: Record<string, number> = {};
	for (let position = 0; position < normalized.length; position += 1) {
		const name = normalized[position];
		if (name !== undefined && name !== "") {
			index[name] = position;
		}
	}

	return index;
};

export const cellOf = (
	row: readonly string[],
	columns: TColumnIndex,
	name: string,
): string => {
	const index = columns[name];
	return index === undefined ? "" : (row[index] ?? "");
};

export const digitsOf = (value: string): string => value.replace(/[^0-9]/g, "");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_PARTS = 3;

export const dateValid = (value: string): boolean => {
	if (!DATE_PATTERN.test(value)) {
		return false;
	}

	const parts = value.split("-").map(Number);
	const [year, month, day] = parts;

	if (
		parts.length !== DATE_PARTS ||
		year === undefined ||
		month === undefined ||
		day === undefined
	) {
		return false;
	}

	const date = new Date(`${value}T00:00:00Z`);
	return (
		Number.isFinite(date.getTime()) &&
		date.getUTCFullYear() === year &&
		date.getUTCMonth() + 1 === month &&
		date.getUTCDate() === day
	);
};
