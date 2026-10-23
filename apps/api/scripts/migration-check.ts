import { A } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import {
	MIGRATION_SAFETY_MARKER,
	PRE_POLICY_MIGRATIONS,
	REMEDY,
	UNSAFE_STATEMENTS,
	type TUnsafeStatement,
} from "./migration-rules.ts";

export type TMigrationViolation = {
	file: string;
	line: number;
	statement: TUnsafeStatement;
	source: string;
	remedy: string;
};

type TNormalized = {
	text: string;
	lineOf: readonly number[];
	sourceOf: readonly string[];
};

const FIRST_LINE = 1;
const NOT_FOUND = -1;
const COMMENT_START = "--";
const SEPARATOR = " ";
const EMPTY = "";
const NEWLINE = "\n";
const WHITESPACE_RUN = /\s+/g;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;

const newlineCount = (text: string): number =>
	text.split(NEWLINE).length - FIRST_LINE;

const withoutBlockComments = (contents: string): string =>
	contents.replace(
		BLOCK_COMMENT,
		(found): string => `${SEPARATOR}${NEWLINE.repeat(newlineCount(found))}`,
	);

const withoutComment = (line: string): string =>
	A.head(line.split(COMMENT_START)) ?? EMPTY;

const collapsed = (line: string): string =>
	withoutComment(line).replace(WHITESPACE_RUN, SEPARATOR).trim();

const appended = (
	accumulated: TNormalized,
	line: string,
	index: number,
): TNormalized => {
	const cleaned = collapsed(line);

	return match(cleaned)
		.with(EMPTY, (): TNormalized => accumulated)
		.otherwise((): TNormalized => {
			const piece = match(accumulated.text)
				.with(EMPTY, (): string => cleaned)
				.otherwise((): string => `${SEPARATOR}${cleaned}`);

			return {
				text: `${accumulated.text}${piece}`,
				lineOf: [
					...accumulated.lineOf,
					...A.make(piece.length, index + FIRST_LINE),
				],
				sourceOf: [...accumulated.sourceOf, ...A.make(piece.length, cleaned)],
			};
		});
};

export const normalize = (contents: string): TNormalized =>
	A.reduceWithIndex<string, TNormalized>(
		withoutBlockComments(contents).split(NEWLINE),
		{ text: EMPTY, lineOf: [], sourceOf: [] },
		(accumulated, line, index) => appended(accumulated, line, index),
	);

const indexesOf = (
	haystack: string,
	needle: string,
	from: number,
): readonly number[] => {
	const at = haystack.indexOf(needle, from);

	return match(at)
		.with(NOT_FOUND, (): readonly number[] => [])
		.otherwise((found): readonly number[] => [
			found,
			...indexesOf(haystack, needle, found + needle.length),
		]);
};

const isExempt = (file: string, contents: string): boolean =>
	A.includes(PRE_POLICY_MIGRATIONS, file) ||
	contents.toLowerCase().includes(MIGRATION_SAFETY_MARKER.toLowerCase());

const violationsOf = (
	file: string,
	normalized: TNormalized,
	statement: TUnsafeStatement,
): readonly TMigrationViolation[] =>
	A.map(
		indexesOf(normalized.text.toUpperCase(), statement, 0),
		(at): TMigrationViolation => ({
			file,
			line: normalized.lineOf[at] ?? FIRST_LINE,
			statement,
			source: normalized.sourceOf[at] ?? EMPTY,
			remedy: REMEDY[statement],
		}),
	);

export const violationsFor = (
	file: string,
	contents: string,
): readonly TMigrationViolation[] =>
	match(isExempt(file, contents))
		.with(true, (): readonly TMigrationViolation[] => [])
		.otherwise((): readonly TMigrationViolation[] => {
			const normalized = normalize(contents);

			return A.flat(
				A.map(UNSAFE_STATEMENTS, (statement) =>
					violationsOf(file, normalized, statement),
				),
			);
		});
