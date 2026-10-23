import { APP_MESSAGE } from "@app/messages";
import { loginSearchSchema } from "@app/schemas";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GalleryVerticalEnd } from "lucide-react";
import type { FC, ReactElement } from "react";
import { LoginForm } from "#/routes/_public/login/_components/login-form.tsx";

const LoginPage: FC = (): ReactElement => {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<Link to="/" className="flex items-center gap-2 font-medium">
						<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<GalleryVerticalEnd className="size-4" />
						</div>
						{APP_MESSAGE.NAME}
					</Link>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<LoginForm />
					</div>
				</div>
			</div>
			<div className="bg-muted relative hidden lg:block">
				<div className="absolute inset-0 flex items-center justify-center">
					<GalleryVerticalEnd className="size-24 text-muted-foreground/20" />
				</div>
			</div>
		</div>
	);
};

export const Route = createFileRoute("/_public/login/")({
	validateSearch: loginSearchSchema,
	component: LoginPage,
});
