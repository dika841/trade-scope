import { dataSourceSchema, type TDataSource } from "@app/schemas";
import type { TDataSourceRow } from "#/data-source/domain/data-source.ts";

export const toDataSourceDto = (row: TDataSourceRow): TDataSource =>
	dataSourceSchema.parse({
		id: row.id,
		name: row.name,
		kind: row.kind,
		url: row.url,
		isActive: row.isActive,
		hasSecret: row.secretCiphertext !== null,
		secretHint: row.secretHint,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	});
