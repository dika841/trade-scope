import { USER_MESSAGE } from "@app/messages";
import type { TUserListInput, TUserSort } from "@app/schemas";
import { D } from "@mobily/ts-belt";
import {
	type UseMutationResult,
	type UseSuspenseQueryOptions,
	type UseSuspenseQueryResult,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { match } from "ts-pattern";
import { useSession } from "#/libs/auth/use-session.ts";
import { orpc } from "#/libs/orpc/client.ts";
import { useProcedureMutation } from "#/libs/orpc/procedure-mutation.ts";
import { suspenseQueryOptionsFor } from "#/libs/orpc/procedure-query.ts";
import type {
	TClientErrors,
	TClientInputs,
	TClientOutputs,
} from "#/libs/orpc/types.ts";
import type { TListChange } from "#/libs/table/list-patch.ts";

type TUserIn = TClientInputs["user"];
type TUserOut = TClientOutputs["user"];
type TUserErr = TClientErrors["user"];

export type TUserSearch = {
	value: string;
	onChange: (next: string) => void;
};

const listRouteApi = getRouteApi("/_authenticated/users/");
const editRouteApi = getRouteApi("/_authenticated/users/$userId");

const userAndRoleKeys = (): readonly (readonly unknown[])[] => [
	orpc.user.key(),
	orpc.role.key(),
];

export const userListOptions = (
	input: TUserListInput,
): UseSuspenseQueryOptions<TUserOut["list"], TUserErr["list"]> =>
	suspenseQueryOptionsFor(orpc.user.list, input);

export const userGetOptions = (
	id: string,
): UseSuspenseQueryOptions<TUserOut["get"], TUserErr["get"]> =>
	suspenseQueryOptionsFor(orpc.user.get, { id });

export const useUserList = (): UseSuspenseQueryResult<
	TUserOut["list"],
	TUserErr["list"]
> => useSuspenseQuery(userListOptions(listRouteApi.useSearch()));

export const useUserGet = (): UseSuspenseQueryResult<
	TUserOut["get"],
	TUserErr["get"]
> => useSuspenseQuery(userGetOptions(editRouteApi.useParams().userId));

export const useUserSearch = (): TUserSearch => {
	const navigate = listRouteApi.useNavigate();
	const { search } = listRouteApi.useSearch();

	return {
		value: search ?? "",
		onChange: (next: string): void => {
			const value = match(next)
				.with("", () => undefined)
				.otherwise((text) => text);
			void navigate({
				search: (prev) => D.merge(prev, { search: value, page: 1 }),
			});
		},
	};
};

export const useUserListChange = (): TListChange<TUserSort> => {
	const navigate = listRouteApi.useNavigate();
	return (patch): void => {
		void navigate({ search: (prev) => D.merge(prev, patch) });
	};
};

export const useIsSelf = (): ((id: string) => boolean) => {
	const session = useSession();
	return (id: string): boolean => session?.user.id === id;
};

export const useUserCreate = (): UseMutationResult<
	TUserOut["create"],
	TUserErr["create"],
	TUserIn["create"]
> =>
	useProcedureMutation(orpc.user.create, {
		message: USER_MESSAGE.CREATED,
		invalidates: userAndRoleKeys(),
	});

export const useUserUpdate = (): UseMutationResult<
	TUserOut["update"],
	TUserErr["update"],
	TUserIn["update"]
> =>
	useProcedureMutation(orpc.user.update, {
		message: USER_MESSAGE.UPDATED,
		invalidates: userAndRoleKeys(),
	});

export const useUserPasswordReset = (): UseMutationResult<
	TUserOut["resetPassword"],
	TUserErr["resetPassword"],
	TUserIn["resetPassword"]
> =>
	useProcedureMutation(orpc.user.resetPassword, {
		message: USER_MESSAGE.PASSWORD_RESET,
		invalidates: [],
	});

export const useUserDelete = (): UseMutationResult<
	TUserOut["remove"],
	TUserErr["remove"],
	TUserIn["remove"]
> =>
	useProcedureMutation(orpc.user.remove, {
		message: USER_MESSAGE.DELETED,
		invalidates: userAndRoleKeys(),
	});
