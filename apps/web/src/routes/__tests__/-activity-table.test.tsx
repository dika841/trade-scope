import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ACTIVITY_SORT, SORT_DIRECTION } from "@app/schemas";
import { ActivityTable } from "#/routes/_authenticated/activity/_components/activity-table.tsx";

const FILTERS_LABEL = "Activity filters";

vi.mock(
	"#/routes/_authenticated/activity/_components/activity-filters.tsx",
	() => ({
		ActivityFilters: (): ReactElement => (
			<fieldset aria-label={FILTERS_LABEL} />
		),
	}),
);

describe("ActivityTable", () => {
	it("renders an empty state when there are no entries", (): void => {
		render(
			<ActivityTable
				list={{ items: [], total: 0, page: 1, pageSize: 20 }}
				sortBy={ACTIVITY_SORT.CREATED_AT}
				sortDir={SORT_DIRECTION.DESC}
				onChange={() => undefined}
			/>,
		);
		expect(screen.getByText("No activity yet.")).toBeInTheDocument();
	});

	it("keeps the filters when they match nothing", (): void => {
		render(
			<ActivityTable
				list={{ items: [], total: 0, page: 1, pageSize: 20 }}
				sortBy={ACTIVITY_SORT.CREATED_AT}
				sortDir={SORT_DIRECTION.DESC}
				onChange={() => undefined}
			/>,
		);
		expect(screen.getByLabelText(FILTERS_LABEL)).toBeInTheDocument();
	});
});
