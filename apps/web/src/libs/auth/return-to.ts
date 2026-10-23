import { match, P } from "ts-pattern";

const PATH_PREFIX = "/";
const PROTOCOL_RELATIVE_PREFIX = "//";
const BACKSLASH = "\\";

export const RETURN_TO_DEFAULT = "/dashboard";

const isLocalPath = (value: string): boolean =>
	value.startsWith(PATH_PREFIX) &&
	!value.startsWith(PROTOCOL_RELATIVE_PREFIX) &&
	!value.includes(BACKSLASH);

export const returnToResolve = (requested: string | undefined): string =>
	match(requested)
		.with(P.string.select(), (found): string =>
			isLocalPath(found) ? found : RETURN_TO_DEFAULT,
		)
		.otherwise((): string => RETURN_TO_DEFAULT);
