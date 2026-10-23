import { useStore } from "@tanstack/react-store";
import type { FC, ReactElement } from "react";
import { Toaster } from "sonner";
import { themeStore } from "#/libs/theme/theme-store.ts";

export const AppToaster: FC = (): ReactElement => {
	const theme = useStore(themeStore);

	return <Toaster theme={theme} richColors closeButton />;
};
