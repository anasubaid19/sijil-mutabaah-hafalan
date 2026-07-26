import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { userProfile } from "@/lib/db/schema";

export const Route = createFileRoute("/api/user-profile")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const session = await auth.api.getSession({
						headers: request.headers,
					});
					if (!session)
						return Response.json({ error: "Unauthorized" }, { status: 401 });

					const [row] = await db
						.select()
						.from(userProfile)
						.where(eq(userProfile.id, session.user.id));
					return Response.json(row ?? null);
				} catch (e) {
					console.error("GET /api/user-profile error:", e);
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
						.insert(userProfile)
						.values({
							id: session.user.id,
							nama: body.nama,
							role: body.role ?? "musyrif",
						})
						.onConflictDoUpdate({
							target: userProfile.id,
							set: {
								nama: body.nama,
								role: body.role ?? "musyrif",
								updatedAt: new Date(),
							},
						})
						.returning();
					return Response.json(row, { status: 201 });
				} catch (e) {
					console.error("POST /api/user-profile error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},

			PUT: async ({ request }) => {
				try {
					const session = await auth.api.getSession({
						headers: request.headers,
					});
					if (!session)
						return Response.json({ error: "Unauthorized" }, { status: 401 });

					const body = await request.json();
					const [row] = await db
						.update(userProfile)
						.set({
							nama: body.nama,
							role: body.role,
							updatedAt: new Date(),
						})
						.where(eq(userProfile.id, session.user.id))
						.returning();
					return Response.json(row);
				} catch (e) {
					console.error("PUT /api/user-profile error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
