export const formatHsCode = (hsCode: string): string =>
	hsCode.length === 6 ? `${hsCode.slice(0, 4)}.${hsCode.slice(4)}` : hsCode;
