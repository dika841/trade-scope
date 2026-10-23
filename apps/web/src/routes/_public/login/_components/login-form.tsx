import { Button } from "@app/components/ui/button";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { Loader2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useLoginForm } from "#/routes/_public/login/_hooks/use-login.ts";
import { AUTH_MESSAGE } from "@app/messages";

export const LoginForm: FC = (): ReactElement => {
	const { form, serverError, onSubmit } = useLoginForm();

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-6">
			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="text-2xl font-bold">{AUTH_MESSAGE.LOGIN_TITLE}</h1>
				<p className="text-muted-foreground text-sm text-balance">
					{AUTH_MESSAGE.LOGIN_DESCRIPTION}
				</p>
			</div>
			<div className="grid gap-6">
				<form.Field name="email">
					{(field) => (
						<div className="grid gap-1.5">
							<Label htmlFor={field.name}>{AUTH_MESSAGE.FIELD_EMAIL}</Label>
							<Input
								id={field.name}
								type="email"
								placeholder={AUTH_MESSAGE.EMAIL_PLACEHOLDER}
								aria-invalid={hasFieldError(field.state.meta.errorMap)}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
							<FieldError errorMap={field.state.meta.errorMap} />
						</div>
					)}
				</form.Field>
				<form.Field name="password">
					{(field) => (
						<div className="grid gap-1.5">
							<Label htmlFor={field.name}>{AUTH_MESSAGE.FIELD_PASSWORD}</Label>
							<Input
								id={field.name}
								type="password"
								placeholder={AUTH_MESSAGE.PASSWORD_PLACEHOLDER}
								aria-invalid={hasFieldError(field.state.meta.errorMap)}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
							<FieldError errorMap={field.state.meta.errorMap} />
						</div>
					)}
				</form.Field>
				<FieldError errors={serverError ? [{ message: serverError }] : []} />
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => (
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting && <Loader2 className="animate-spin" />}
							{isSubmitting
								? AUTH_MESSAGE.SIGNING_IN
								: AUTH_MESSAGE.LOGIN_ACTION}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
};
