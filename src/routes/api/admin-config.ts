import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";

export const Route = createFileRoute("/api/admin-config")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				});
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				if (session.user.username !== "anasubaid19")
					return Response.json({ error: "Forbidden" }, { status: 403 });

				try {
					const rows = await db.select().from(appConfig);
					const byKey: Record<string, string> = {};
					for (const r of rows) byKey[r.key] = r.value ?? "";
					return Response.json({
						botToken: byKey["TELEGRAM_BOT_TOKEN"] ?? "",
						chatId: byKey["TELEGRAM_CHAT_ID"] ?? "",
					});
				} catch (e) {
					console.error("GET /api/admin-config error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},

			POST: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				});
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				if (session.user.username !== "anasubaid19")
					return Response.json({ error: "Forbidden" }, { status: 403 });

				try {
					const { key, value } = (await request.json()) as {
						key: string;
						value: string;
					};

					await db.insert(appConfig).values({ key, value }).onConflictDoUpdate({
						target: appConfig.key,
						set: { value },
					});

					return Response.json({ ok: true });
				} catch (e) {
					console.error("POST /api/admin-config error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
