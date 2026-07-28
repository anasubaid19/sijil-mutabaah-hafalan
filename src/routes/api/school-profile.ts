import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";

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
					const rows = await db.select().from(appConfig);
					const result: Record<string, string> = {};
					for (const r of rows) result[r.key] = r.value ?? "";
					return Response.json({
						logo: result.SCHOOL_LOGO ?? "",
						foundationName: result.SCHOOL_FOUNDATION_NAME ?? "",
						schoolName: result.SCHOOL_NAME ?? "",
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

					const upserts = [];
					if (body.logo !== undefined)
						upserts.push(
							db
								.insert(appConfig)
								.values({ key: "SCHOOL_LOGO", value: body.logo })
								.onConflictDoUpdate({
									target: appConfig.key,
									set: { value: body.logo },
								}),
						);
					if (body.foundationName !== undefined)
						upserts.push(
							db
								.insert(appConfig)
								.values({
									key: "SCHOOL_FOUNDATION_NAME",
									value: body.foundationName,
								})
								.onConflictDoUpdate({
									target: appConfig.key,
									set: { value: body.foundationName },
								}),
						);
					if (body.schoolName !== undefined)
						upserts.push(
							db
								.insert(appConfig)
								.values({ key: "SCHOOL_NAME", value: body.schoolName })
								.onConflictDoUpdate({
									target: appConfig.key,
									set: { value: body.schoolName },
								}),
						);

					await Promise.all(upserts);
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
