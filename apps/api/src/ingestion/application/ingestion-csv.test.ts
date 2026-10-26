import { INGESTION_ERRORS_MAX } from "@app/schemas";
import { describe, expect, it } from "vitest";
import { EBadRequest } from "#/shared/errors.ts";
import { ingestionCsvParse } from "./ingestion-csv.ts";

const HEADER = "hs_code,hs_revision,description\n";
const FULL_HEADER =
	"hs_code,hs_revision,description,parent_hs_code,level,aliases,language,valid_from,valid_to\n";

describe("ingestionCsvParse", () => {
	it("parses required and optional columns, aliases and quoted commas", (): void => {
		const parsed = ingestionCsvParse(
			`${FULL_HEADER}090121,HS2022,"Coffee, roasted",0901,6,roasted coffee|ground coffee,en,2022-01-01,\n`,
		);

		expect(parsed.totalRows).toBe(1);
		expect(parsed.failures).toEqual([]);
		expect(parsed.products[0]).toMatchObject({
			hsCode: "090121",
			hsRevision: "HS2022",
			description: "Coffee, roasted",
			parentHsCode: "0901",
			level: 6,
			aliases: ["roasted coffee", "ground coffee"],
			language: "en",
			validFrom: "2022-01-01",
			validTo: null,
		});
	});

	it("defaults the level to the code length and the language to English", (): void => {
		const parsed = ingestionCsvParse(`${HEADER}0901,HS2022,Coffee\n`);

		expect(parsed.products[0]?.level).toBe(4);
		expect(parsed.products[0]?.language).toBe("en");
		expect(parsed.products[0]?.aliases).toEqual([]);
	});

	it("reports a bad header as a request error", (): void => {
		expect(() => ingestionCsvParse("code,revision\n0901,HS2022")).toThrow(
			EBadRequest,
		);
	});

	it("reports an unterminated quote as a request error", (): void => {
		expect(() => ingestionCsvParse(`${HEADER}0901,HS2022,"Coffee\n`)).toThrow(
			EBadRequest,
		);
	});

	it("rejects unknown columns so a typo cannot import silently", (): void => {
		expect(() =>
			ingestionCsvParse("hs_code,hs_revision,description,descripton\n"),
		).toThrow(EBadRequest);
	});

	it("counts invalid rows and keeps the valid ones", (): void => {
		const parsed = ingestionCsvParse(
			`hs_code,hs_revision,description,level\n0901,HS2022,Coffee,4\nabc,HS2022,Bad code,4\n0902,HS2022,Tea,not-a-level\n`,
		);

		expect(parsed.totalRows).toBe(3);
		expect(parsed.products).toHaveLength(1);
		expect(parsed.failures).toHaveLength(2);
	});

	it("rejects a repeated code and revision in the same file", (): void => {
		const parsed = ingestionCsvParse(
			`${HEADER}0901,HS2022,Coffee\n0901,HS2022,Coffee again\n`,
		);

		expect(parsed.products).toHaveLength(1);
		expect(parsed.failures).toHaveLength(1);
	});

	it("skips blank lines without counting them", (): void => {
		const parsed = ingestionCsvParse(
			`${HEADER}0901,HS2022,Coffee\n\n\n0902,HS2022,Tea\n`,
		);

		expect(parsed.totalRows).toBe(2);
		expect(parsed.products).toHaveLength(2);
	});

	it("caps the reported failures while still reading every row", (): void => {
		const rows = Array.from(
			{ length: INGESTION_ERRORS_MAX + 5 },
			(_, index) => `bad-${index},HS2022,Description`,
		).join("\n");
		const parsed = ingestionCsvParse(`${HEADER}${rows}\n`);

		expect(parsed.totalRows).toBe(INGESTION_ERRORS_MAX + 5);
		expect(parsed.failures).toHaveLength(INGESTION_ERRORS_MAX);
	});
});
