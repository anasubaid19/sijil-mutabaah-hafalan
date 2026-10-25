import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { userProfile } from "@/lib/db/schema";
import { isMigrationMode, migrationBlockedResponse } from "@/lib/migration";

export const Route = createFileRoute("/api/school-profile")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				});
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				try {
					const [row] = await db
						.select({
							schoolLogo: userProfile.schoolLogo,
							schoolFoundationName: userProfile.schoolFoundationName,
							schoolName: userProfile.schoolName,
						})
						.from(userProfile)
						.where(eq(userProfile.id, session.user.id));
					return Response.json({
						logo: row?.schoolLogo ?? "",
						foundationName: row?.schoolFoundationName ?? "",
						schoolName: row?.schoolName ?? "",
					});
				} catch (e) {
					console.error("GET /api/school-profile error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},

			POST: async ({ request }) => {
				if (await isMigrationMode()) return migrationBlockedResponse();
				const session = await auth.api.getSession({
					headers: request.headers,
				});
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				try {
					const body = (await request.json()) as {
						logo?: string;
						foundationName?: string;
						schoolName?: string;
					};

					// School profile lives on the user's own profile row, so one
					// musyrif's institution never leaks into another's reports.
					const patch: {
						schoolLogo?: string | null;
						schoolFoundationName?: string | null;
						schoolName?: string | null;
						updatedAt: Date;
					} = { updatedAt: new Date() };
					if (body.logo !== undefined)
						patch.schoolLogo = body.logo.trim() ? body.logo : null;
					if (body.foundationName !== undefined)
						patch.schoolFoundationName = body.foundationName.trim()
							? body.foundationName
							: null;
					if (body.schoolName !== undefined)
						patch.schoolName = body.schoolName.trim() ? body.schoolName : null;

					await db
						.insert(userProfile)
						.values({
							id: session.user.id,
							nama: session.user.name || "Musyrif",
							role: "musyrif",
							...patch,
						})
						.onConflictDoUpdate({
							target: userProfile.id,
							set: patch,
						});

					return Response.json({ ok: true });
				} catch (e) {
					console.error("POST /api/school-profile error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
