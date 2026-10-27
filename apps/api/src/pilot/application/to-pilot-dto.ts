import { pilotSchema, type TPilot } from "@app/schemas";
import type { TPilotRow } from "#/pilot/domain/pilot.ts";

export const toPilotDto = (row: TPilotRow): TPilot =>
	pilotSchema.parse({
		id: row.id,
		hsCode: row.hsCode,
		hsRevision: row.hsRevision,
		productDescription: row.productDescription,
		marketIso2: row.marketIso2,
		marketName: row.marketName ?? row.marketIso2,
		status: row.status,
		ownerId: row.ownerId,
		ownerName: row.ownerName,
		ownerEmail: row.ownerEmail,
		notes: row.notes,
		createdBy: row.createdBy,
		createdByEmail: row.createdByEmail,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	});
