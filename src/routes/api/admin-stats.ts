import { createFileRoute } from "@tanstack/react-router";
import { count, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { setoran, siswa, user, userProfile } from "@/lib/db/schema";

export const Route = createFileRoute("/api/admin-stats")({
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
					const [
						[{ count: totalUsers }],
						[{ count: totalMusyrif }],
						[{ count: totalSiswa }],
						[{ count: totalSetoran }],
						users,
					] = await Promise.all([
						db.select({ count: count() }).from(user),
						db
							.select({ count: count() })
							.from(userProfile)
							.where(eq(userProfile.role, "musyrif")),
						db.select({ count: count() }).from(siswa),
						db.select({ count: count() }).from(setoran),
						db
							.select({
								id: user.id,
								name: user.name,
								username: user.username,
								email: user.email,
								createdAt: user.createdAt,
								role: userProfile.role,
								halaqahName: userProfile.halaqahName,
							})
							.from(user)
							.leftJoin(userProfile, eq(user.id, userProfile.id))
							.orderBy(user.createdAt),
					]);

					return Response.json({
						totalUsers,
						totalMusyrif,
						totalSiswa,
						totalSetoran,
						users,
					});
				} catch (e) {
					console.error("GET /api/admin-stats error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
