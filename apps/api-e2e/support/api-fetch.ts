import { BASE_URL } from "./client.ts";

type TApiRequest = {
	path: string;
	cookie: string;
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	body?: unknown;
};

export const apiFetch = ({
	path,
	cookie,
	method = "GET",
	body,
}: TApiRequest): Promise<Response> =>
	fetch(`${BASE_URL}/api${path}`, {
		method,
		headers: { "Content-Type": "application/json", cookie },
		body: body === undefined ? undefined : JSON.stringify(body),
	});

export const apiJson = async <T>(request: TApiRequest): Promise<T> => {
	const response = await apiFetch(request);
	return (await response.json()) as T;
};
