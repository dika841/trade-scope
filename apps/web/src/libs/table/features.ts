import {
	columnVisibilityFeature,
	rowPaginationFeature,
	rowSortingFeature,
	tableFeatures,
} from "@tanstack/react-table";

export type TColumnMeta = {
	className?: string;
};

export const TABLE_FEATURES = tableFeatures({
	rowSortingFeature,
	rowPaginationFeature,
	columnVisibilityFeature,
	columnMeta: {} as TColumnMeta,
});

export type TTableFeatures = typeof TABLE_FEATURES;
