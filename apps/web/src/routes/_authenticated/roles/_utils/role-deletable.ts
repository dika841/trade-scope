import type { TRoleDto } from "@app/schemas";

export const roleDeletable = (role: TRoleDto): boolean =>
	!role.fixed && role.memberCount === 0;
