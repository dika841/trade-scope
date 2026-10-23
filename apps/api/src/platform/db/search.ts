import { type AnyColumn, ilike, type SQL } from "drizzle-orm";

const LIKE_ESCAPE = "\\";
const LIKE_SPECIAL = /[\\%_]/g;

export const likeEscape = (value: string): string =>
	value.replace(LIKE_SPECIAL, (found): string => `${LIKE_ESCAPE}${found}`);

export const containsWhere = (column: AnyColumn, value: string): SQL =>
	ilike(column, `%${likeEscape(value)}%`);
