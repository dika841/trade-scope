export const THEME = {
	DARK: "dark",
	LIGHT: "light",
} as const;

export type TTheme = (typeof THEME)[keyof typeof THEME];

export const THEME_STORAGE_KEY = "theme";
