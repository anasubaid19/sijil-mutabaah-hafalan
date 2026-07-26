import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { waliLink } from "@/lib/db/schema";

export const Route = createFileRoute("/api/wali-link")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const session = await auth.api.getSession({
						headers: request.headers,
					});
					if (!session)
						return Response.json({ error: "Unauthorized" }, { status: 401 });

					const rows = await db
						.select()
						.from(waliLink)
						.where(eq(waliLink.waliId, session.user.id));
					return Response.json(rows);
				} catch (e) {
					console.error("GET /api/wali-link error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},

			POST: async ({ request }) => {
				try {
					const session = await auth.api.getSession({
						headers: request.headers,
					});
					if (!session)
						return Response.json({ error: "Unauthorized" }, { status: 401 });

					const body = await request.json();
					const [row] = await db
						.insert(waliLink)
						.values({
							waliId: session.user.id,
							siswaId: body.siswaId,
							hubungan: body.hubungan,
						})
						.returning();
					return Response.json(row, { status: 201 });
				} catch (e) {
					console.error("POST /api/wali-link error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},

			DELETE: async ({ request }) => {
				try {
					const session = await auth.api.getSession({
						headers: request.headers,
					});
					if (!session)
						return Response.json({ error: "Unauthorized" }, { status: 401 });

					const { searchParams } = new URL(request.url);
					const id = searchParams.get("id");
					if (!id)
						return Response.json({ error: "id required" }, { status: 400 });

					const [owned] = await db
						.select({ id: waliLink.id })
						.from(waliLink)
						.where(
							and(eq(waliLink.id, id), eq(waliLink.waliId, session.user.id)),
						)
						.limit(1);
					if (!owned)
						return Response.json({ error: "Forbidden" }, { status: 403 });

					await db.delete(waliLink).where(eq(waliLink.id, id));
					return Response.json({ ok: true });
				} catch (e) {
					console.error("DELETE /api/wali-link error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
