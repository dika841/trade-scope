import { Store } from "@tanstack/store";
import { match } from "ts-pattern";
import { THEME, THEME_STORAGE_KEY, type TTheme } from "#/libs/theme/theme.ts";

const themeRead = (): TTheme =>
	match(localStorage.getItem(THEME_STORAGE_KEY))
		.with(THEME.LIGHT, (): TTheme => THEME.LIGHT)
		.otherwise((): TTheme => THEME.DARK);

const themeApply = (theme: TTheme): void => {
	document.documentElement.classList.toggle(THEME.DARK, theme === THEME.DARK);
	localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const themeStore = new Store<TTheme>(themeRead());

export const themeSet = (theme: TTheme): void => {
	themeApply(theme);
	themeStore.setState(() => theme);
};

export const themeToggle = (): void =>
	themeSet(
		match(themeStore.state)
			.with(THEME.DARK, (): TTheme => THEME.LIGHT)
			.otherwise((): TTheme => THEME.DARK),
	);
