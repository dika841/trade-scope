import { ERROR_MESSAGE } from "@app/messages";

export class EServerUnreachable extends Error {
	constructor() {
		super(ERROR_MESSAGE.SERVER_UNREACHABLE_TITLE);
		this.name = "EServerUnreachable";
	}
}

export const isServerUnreachable = (error: unknown): boolean =>
	error instanceof EServerUnreachable;
