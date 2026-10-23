import { ERROR_MESSAGE } from "@app/messages";

export class EForbidden extends Error {
	constructor() {
		super(ERROR_MESSAGE.FORBIDDEN_TITLE);
		this.name = "EForbidden";
	}
}

export const isForbidden = (error: unknown): boolean =>
	error instanceof EForbidden;
