const RESOURCE = {
	USERS: "/users",
	ROLES: "/roles",
} as const;

export const ROUTE_PATH = {
	HEALTH: "/health",
	HEALTHZ: "/healthz",
	READY: "/ready",
	METRICS: "/metrics",
	ME: "/me",
	PERMISSIONS: "/permissions",
	ACTIVITY: "/activity",
	PRODUCTS: "/products",
	PRODUCT: "/products/{hsCode}",
	USERS: RESOURCE.USERS,
	USER: `${RESOURCE.USERS}/{id}`,
	USER_PASSWORD: `${RESOURCE.USERS}/{id}/password`,
	ROLES: RESOURCE.ROLES,
	ROLE: `${RESOURCE.ROLES}/{key}`,
} as const;
export type TRoutePath = (typeof ROUTE_PATH)[keyof typeof ROUTE_PATH];

const OPENAPI_PREFIX = "/api";

export const ROUTE_PREFIX = {
	RPC: "/rpc",
	OPENAPI: OPENAPI_PREFIX,
	AUTH: `${OPENAPI_PREFIX}/auth`,
} as const;
