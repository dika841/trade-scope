import {
	INGESTION_CSV_MAX_BYTES,
	INGESTION_MODE,
	ingestionRunCreateInputSchema,
	type TIngestionMode,
} from "@app/schemas";
import { INGESTION_MESSAGE } from "@app/messages";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	type TConfirmedForm,
	useConfirmedForm,
} from "#/routes/_authenticated/_hooks/use-confirmed-form.ts";
import {
	ingestionRunFormSchema,
	type TIngestionRunFormValues,
} from "#/routes/_authenticated/ingestion/_constants/form-schema.ts";
import { useIngestionRunCreate } from "#/routes/_authenticated/ingestion/_hooks/use-ingestion.ts";

const DEFAULT_VALUES: TIngestionRunFormValues = {
	mode: INGESTION_MODE.UPLOAD,
	sourceId: "",
	fileName: "",
	content: "",
};

type TIngestionRunForm = TConfirmedForm<
	TIngestionRunFormValues,
	typeof ingestionRunFormSchema
> & {
	isPending: boolean;
	reading: boolean;
	fileError: string | null;
	onFileChange: (file: File | null) => void;
	onModeChange: (mode: TIngestionMode) => void;
};

export const useIngestionRunForm = (): TIngestionRunForm => {
	const navigate = useNavigate();
	const runCreate = useIngestionRunCreate();
	const [reading, setReading] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);

	const confirmed = useConfirmedForm({
		defaultValues: DEFAULT_VALUES,
		schema: ingestionRunFormSchema,
		run: (value): void => {
			const payload =
				value.mode === INGESTION_MODE.UPLOAD
					? {
							mode: value.mode,
							fileName: value.fileName,
							content: value.content,
						}
					: { mode: value.mode, sourceId: value.sourceId };

			runCreate.mutate(ingestionRunCreateInputSchema.parse(payload), {
				onSuccess: (run) => {
					void navigate({
						to: "/ingestion/$runId",
						params: { runId: run.id },
					});
				},
			});
		},
	});

	const onFileChange = (file: File | null): void => {
		setFileError(null);
		confirmed.form.setFieldValue("fileName", file?.name ?? "");
		confirmed.form.setFieldValue("content", "");

		if (file === null) {
			return;
		}

		if (file.size > INGESTION_CSV_MAX_BYTES) {
			setFileError(INGESTION_MESSAGE.FILE_TOO_LARGE);
			return;
		}

		setReading(true);
		void file
			.text()
			.then((text) => {
				confirmed.form.setFieldValue("content", text);
			})
			.catch(() => {
				setFileError(INGESTION_MESSAGE.FILE_UNREADABLE);
			})
			.finally(() => {
				setReading(false);
			});
	};

	const onModeChange = (mode: TIngestionMode): void => {
		confirmed.form.setFieldValue("mode", mode);
		confirmed.form.setFieldValue("sourceId", "");
		confirmed.form.setFieldValue("fileName", "");
		confirmed.form.setFieldValue("content", "");
		setFileError(null);
	};

	return {
		...confirmed,
		isPending: runCreate.isPending,
		reading,
		fileError,
		onFileChange,
		onModeChange,
	};
};
