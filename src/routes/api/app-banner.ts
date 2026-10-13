import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";

const DEFAULT_MESSAGE =
	"Aplikasi akan dipindahkan ke server baru. Selama proses migrasi, aplikasi mungkin tidak dapat diakses sementara. Informasi selanjutnya akan disampaikan setelah migrasi berhasil.";

export const Route = createFileRoute("/api/app-banner")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				});
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				try {
					const rows = await db.select().from(appConfig);
					const byKey: Record<string, string> = {};
					for (const r of rows) byKey[r.key] = r.value ?? "";

					return Response.json({
						enabled: byKey.MIGRATION_BANNER_ENABLED === "1",
						message: byKey.MIGRATION_BANNER_MESSAGE || DEFAULT_MESSAGE,
					});
				} catch (e) {
					console.error("GET /api/app-banner error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
