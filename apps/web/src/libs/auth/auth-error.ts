import { AUTH_MESSAGE } from "@app/messages";
import { match } from "ts-pattern";

const AUTH_ERROR_CODE = {
	INVALID_EMAIL_OR_PASSWORD: "INVALID_EMAIL_OR_PASSWORD",
	INVALID_PASSWORD: "INVALID_PASSWORD",
} as const;

export type TAuthError = {
	code?: string | undefined;
};

export const signInErrorMessage = (error: TAuthError): string =>
	match(error.code)
		.with(
			AUTH_ERROR_CODE.INVALID_EMAIL_OR_PASSWORD,
			(): string => AUTH_MESSAGE.INVALID_CREDENTIALS,
		)
		.otherwise((): string => AUTH_MESSAGE.SIGN_IN_FAILED);

export const passwordChangeErrorMessage = (error: TAuthError): string =>
	match(error.code)
		.with(
			AUTH_ERROR_CODE.INVALID_PASSWORD,
			(): string => AUTH_MESSAGE.CURRENT_PASSWORD_INCORRECT,
		)
		.otherwise((): string => AUTH_MESSAGE.PASSWORD_CHANGE_FAILED);
