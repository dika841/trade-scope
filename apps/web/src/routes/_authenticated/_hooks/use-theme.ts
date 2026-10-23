import { useStore } from "@tanstack/react-store";
import { THEME } from "#/libs/theme/theme.ts";
import { themeStore, themeToggle } from "#/libs/theme/theme-store.ts";

type TUseTheme = {
	isDark: boolean;
	toggle: () => void;
};

export const useTheme = (): TUseTheme => {
	const theme = useStore(themeStore);

	return { isDark: theme === THEME.DARK, toggle: themeToggle };
};
