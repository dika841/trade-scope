import { toast } from "sonner";

export const toastError = (error: Error): void => {
	toast.error(error.message);
};
