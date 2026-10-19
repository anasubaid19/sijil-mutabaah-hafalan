import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";

/**
 * True when the admin has enabled the migration banner.
 * While active, data writes are rejected so the database stays
 * consistent for the pending server migration.
 */
export async function isMigrationMode(): Promise<boolean> {
	try {
		const [row] = await db
			.select({ value: appConfig.value })
			.from(appConfig)
			.where(eq(appConfig.key, "MIGRATION_BANNER_ENABLED"))
			.limit(1);
		return row?.value === "1";
	} catch {
		// Fail open: if the config read fails, let the normal request path run.
		return false;
	}
}

export function migrationBlockedResponse() {
	return Response.json(
		{
			error:
				"Aplikasi sedang dalam masa migrasi server. Penyimpanan data sementara dinonaktifkan.",
		},
		{ status: 503 },
	);
}
