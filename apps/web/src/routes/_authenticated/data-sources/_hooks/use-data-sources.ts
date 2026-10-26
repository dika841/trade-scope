import { DATA_SOURCE_MESSAGE } from "@app/messages";
import {
	type UseMutationResult,
	type UseSuspenseQueryOptions,
	type UseSuspenseQueryResult,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { orpc } from "#/libs/orpc/client.ts";
import { useProcedureMutation } from "#/libs/orpc/procedure-mutation.ts";
import { suspenseQueryOptionsFor } from "#/libs/orpc/procedure-query.ts";
import type {
	TClientErrors,
	TClientInputs,
	TClientOutputs,
} from "#/libs/orpc/types.ts";

type TDataSourceIn = TClientInputs["dataSource"];
type TDataSourceOut = TClientOutputs["dataSource"];
type TDataSourceErr = TClientErrors["dataSource"];

const dataSourceKeys = (): readonly (readonly unknown[])[] => [
	orpc.dataSource.key(),
];

export const dataSourceListOptions = (): UseSuspenseQueryOptions<
	TDataSourceOut["list"],
	TDataSourceErr["list"]
> => suspenseQueryOptionsFor(orpc.dataSource.list, undefined);

export const dataSourceGetOptions = (
	id: string,
): UseSuspenseQueryOptions<TDataSourceOut["get"], TDataSourceErr["get"]> =>
	suspenseQueryOptionsFor(orpc.dataSource.get, { id });

export const useDataSourceList = (): UseSuspenseQueryResult<
	TDataSourceOut["list"],
	TDataSourceErr["list"]
> => useSuspenseQuery(dataSourceListOptions());

export const useDataSourceGet = (
	id: string,
): UseSuspenseQueryResult<TDataSourceOut["get"], TDataSourceErr["get"]> =>
	useSuspenseQuery(dataSourceGetOptions(id));

export const useDataSourceCreate = (): UseMutationResult<
	TDataSourceOut["create"],
	TDataSourceErr["create"],
	TDataSourceIn["create"]
> =>
	useProcedureMutation(orpc.dataSource.create, {
		message: DATA_SOURCE_MESSAGE.CREATED,
		invalidates: dataSourceKeys(),
	});

export const useDataSourceUpdate = (): UseMutationResult<
	TDataSourceOut["update"],
	TDataSourceErr["update"],
	TDataSourceIn["update"]
> =>
	useProcedureMutation(orpc.dataSource.update, {
		message: DATA_SOURCE_MESSAGE.UPDATED,
		invalidates: dataSourceKeys(),
	});

export const useDataSourceDelete = (): UseMutationResult<
	TDataSourceOut["remove"],
	TDataSourceErr["remove"],
	TDataSourceIn["remove"]
> =>
	useProcedureMutation(orpc.dataSource.remove, {
		message: DATA_SOURCE_MESSAGE.DELETED,
		invalidates: dataSourceKeys(),
	});
