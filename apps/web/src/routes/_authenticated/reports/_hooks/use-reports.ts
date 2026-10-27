import { REPORT_MESSAGE } from "@app/messages";
import type { TReportListInput, TReportSort } from "@app/schemas";
import { D } from "@mobily/ts-belt";
import {
	type UseMutationResult,
	type UseQueryResult,
	type UseSuspenseQueryResult,
	useQuery,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import type { TListChange } from "#/libs/table/list-patch.ts";
import { orpc } from "#/libs/orpc/client.ts";
import { useProcedureMutation } from "#/libs/orpc/procedure-mutation.ts";
import type {
	TClientErrors,
	TClientInputs,
	TClientOutputs,
} from "#/libs/orpc/types.ts";

type TReportIn = TClientInputs["report"];
type TReportOut = TClientOutputs["report"];
type TReportErr = TClientErrors["report"];

const routeApi = getRouteApi("/_authenticated/reports/");

const reportKeys = (): readonly (readonly unknown[])[] => [orpc.report.key()];

export const reportListOptions = (input: TReportListInput) =>
	orpc.report.list.queryOptions({
		input,
		queryKey: orpc.report.list.queryKey({ input }),
	});

export const useReportList = (): UseSuspenseQueryResult<
	TReportOut["list"],
	TReportErr["list"]
> => useSuspenseQuery(reportListOptions(routeApi.useSearch()));

export const useReportListChange = (): TListChange<TReportSort> => {
	const navigate = routeApi.useNavigate();

	return (patch): void => {
		void navigate({ search: (previous) => D.merge(previous, patch) });
	};
};

export const reportGetOptions = (id: string) =>
	orpc.report.get.queryOptions({
		input: { id },
		queryKey: orpc.report.get.queryKey({ input: { id } }),
	});

export const useReport = (
	id: string,
): UseSuspenseQueryResult<TReportOut["get"], TReportErr["get"]> =>
	useSuspenseQuery(reportGetOptions(id));

export const sharedReportOptions = (token: string) =>
	orpc.report.shared.queryOptions({
		input: { token },
		queryKey: orpc.report.shared.queryKey({ input: { token } }),
	});

export const useSharedReport = (
	token: string,
): UseQueryResult<TReportOut["shared"], TReportErr["shared"]> =>
	useQuery({ ...sharedReportOptions(token), retry: false });

export const useReportCreate = (): UseMutationResult<
	TReportOut["create"],
	TReportErr["create"],
	TReportIn["create"]
> =>
	useProcedureMutation(orpc.report.create, {
		message: REPORT_MESSAGE.CREATED,
		invalidates: reportKeys(),
	});

export const useReportRevoke = (): UseMutationResult<
	TReportOut["revoke"],
	TReportErr["revoke"],
	TReportIn["revoke"]
> =>
	useProcedureMutation(orpc.report.revoke, {
		message: REPORT_MESSAGE.REVOKED,
		invalidates: reportKeys(),
	});

export const useReportDelete = (): UseMutationResult<
	TReportOut["remove"],
	TReportErr["remove"],
	TReportIn["remove"]
> =>
	useProcedureMutation(orpc.report.remove, {
		message: REPORT_MESSAGE.DELETED,
		invalidates: reportKeys(),
	});
