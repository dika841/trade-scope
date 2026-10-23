import { SORT_DIRECTION } from "@app/schemas";
import { createColumnHelper } from "@tanstack/react-table";
import { cleanup, render, screen } from "@testing-library/react";
import type { FC, ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { TTableFeatures } from "#/libs/table/features.ts";
import { DataTable } from "#/routes/_authenticated/_components/data-table.tsx";
import { useServerTable } from "#/routes/_authenticated/_hooks/use-server-table.ts";

type TRow = { id: string; title: string; body: string };

const SORT = { TITLE: "title", BODY: "body" } as const;
const ROWS: readonly TRow[] = [{ id: "1", title: "First", body: "Text" }];

const EMPTY_MESSAGE = "Nothing here.";

const helper = createColumnHelper<TTableFeatures, TRow>();

const columns = helper.columns([
	helper.accessor("title", { header: "Title" }),
	helper.accessor("body", { header: "Body", enableSorting: false }),
]);

const Harness: FC = (): ReactElement => {
	const table = useServerTable({
		columns,
		data: ROWS,
		getRowId: (row: TRow): string => row.id,
		total: ROWS.length,
		page: 1,
		pageSize: 20,
		sortBy: SORT.TITLE,
		sortDir: SORT_DIRECTION.DESC,
		sortKeys: [SORT.TITLE],
		onChange: (): void => undefined,
	});

	return <DataTable table={table} emptyMessage={EMPTY_MESSAGE} />;
};

describe("DataTable", () => {
	afterEach(cleanup);

	it("tells assistive technology which column is sorted and how", (): void => {
		render(<Harness />);

		expect(
			screen.getByRole("columnheader", { name: /title/i }),
		).toHaveAttribute("aria-sort", "descending");
	});

	it("leaves a column that cannot be sorted without a sort state", (): void => {
		render(<Harness />);

		expect(
			screen.getByRole("columnheader", { name: /body/i }),
		).not.toHaveAttribute("aria-sort");
	});
});
