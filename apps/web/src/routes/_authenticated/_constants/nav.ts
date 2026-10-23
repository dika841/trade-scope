import { NAV_MESSAGE } from "@app/messages";
import { PERMISSION, type TPermission } from "@app/permissions";
import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
	Activity,
	CircleUser,
	KeyRound,
	LayoutDashboard,
	Shield,
	Users,
} from "lucide-react";

export type TNavItem = {
	to: LinkProps["to"];
	label: string;
	permissions: readonly TPermission[];
	icon: LucideIcon;
};

export const NAV_ITEMS: readonly TNavItem[] = [
	{
		to: "/dashboard",
		label: NAV_MESSAGE.DASHBOARD,
		permissions: [],
		icon: LayoutDashboard,
	},
	{
		to: "/users",
		label: NAV_MESSAGE.USERS,
		permissions: [PERMISSION.USER_MANAGE],
		icon: Users,
	},
	{
		to: "/roles",
		label: NAV_MESSAGE.ROLES,
		permissions: [PERMISSION.USER_MANAGE],
		icon: Shield,
	},
	{
		to: "/permissions",
		label: NAV_MESSAGE.PERMISSIONS,
		permissions: [PERMISSION.USER_MANAGE],
		icon: KeyRound,
	},
	{
		to: "/activity",
		label: NAV_MESSAGE.ACTIVITY,
		permissions: [PERMISSION.ACTIVITY_READ],
		icon: Activity,
	},
	{
		to: "/account",
		label: NAV_MESSAGE.ACCOUNT,
		permissions: [],
		icon: CircleUser,
	},
];
