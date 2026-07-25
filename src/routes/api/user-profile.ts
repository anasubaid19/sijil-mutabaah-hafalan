import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { userProfile } from "@/lib/db/schema";

export const Route = createFileRoute("/api/user-profile")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				const [row] = await db
					.select()
					.from(userProfile)
					.where(eq(userProfile.id, session.user.id));
				return Response.json(row ?? null);
			},

			POST: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
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
					.returning();
				return Response.json(row, { status: 201 });
			},

			PUT: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
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
			},
		},
	},
});
