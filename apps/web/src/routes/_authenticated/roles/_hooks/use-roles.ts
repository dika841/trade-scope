import { ROLE_MESSAGE } from "@app/messages";
import {
	type UseMutationResult,
	type UseSuspenseQueryOptions,
	type UseSuspenseQueryResult,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { orpc } from "#/libs/orpc/client.ts";
import { useProcedureMutation } from "#/libs/orpc/procedure-mutation.ts";
import { suspenseQueryOptionsFor } from "#/libs/orpc/procedure-query.ts";
import type {
	TClientErrors,
	TClientInputs,
	TClientOutputs,
} from "#/libs/orpc/types.ts";

type TRoleIn = TClientInputs["role"];
type TRoleOut = TClientOutputs["role"];
type TRoleErr = TClientErrors["role"];

const editRouteApi = getRouteApi("/_authenticated/roles/$key");

const roleKeys = (): readonly (readonly unknown[])[] => [orpc.role.key()];

export const roleListOptions = (): UseSuspenseQueryOptions<
	TRoleOut["list"],
	TRoleErr["list"]
> => suspenseQueryOptionsFor(orpc.role.list, undefined);

export const roleGetOptions = (
	key: string,
): UseSuspenseQueryOptions<TRoleOut["get"], TRoleErr["get"]> =>
	suspenseQueryOptionsFor(orpc.role.get, { key });

export const useRoleList = (): UseSuspenseQueryResult<
	TRoleOut["list"],
	TRoleErr["list"]
> => useSuspenseQuery(roleListOptions());

export const useRoleGet = (): UseSuspenseQueryResult<
	TRoleOut["get"],
	TRoleErr["get"]
> => useSuspenseQuery(roleGetOptions(editRouteApi.useParams().key));

export const useRoleCreate = (): UseMutationResult<
	TRoleOut["create"],
	TRoleErr["create"],
	TRoleIn["create"]
> =>
	useProcedureMutation(orpc.role.create, {
		message: ROLE_MESSAGE.CREATED,
		invalidates: roleKeys(),
	});

export const useRoleUpdate = (): UseMutationResult<
	TRoleOut["update"],
	TRoleErr["update"],
	TRoleIn["update"]
> =>
	useProcedureMutation(orpc.role.update, {
		message: ROLE_MESSAGE.UPDATED,
		invalidates: roleKeys(),
	});

export const useRoleDelete = (): UseMutationResult<
	TRoleOut["remove"],
	TRoleErr["remove"],
	TRoleIn["remove"]
> =>
	useProcedureMutation(orpc.role.remove, {
		message: ROLE_MESSAGE.DELETED,
		invalidates: roleKeys(),
	});
