import crypto from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { siswa } from "@/lib/db/schema";

function generateStudentId(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let id = "";
	const bytes = crypto.randomBytes(6);
	for (let i = 0; i < 6; i++) id += chars[bytes[i] % chars.length];
	return id;
}

function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16).toString("hex");
	const hash = crypto.scryptSync(password, salt, 64).toString("hex");
	return `${salt}:${hash}`;
}

export const Route = createFileRoute("/api/siswa")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				const rows = await db
					.select()
					.from(siswa)
					.where(eq(siswa.musyrifId, session.user.id));
				return Response.json(rows);
			},

			POST: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				const body = await request.json();
			const [row] = await db
				.insert(siswa)
				.values({
					musyrifId: session.user.id,
					nama: body.nama,
					studentId: generateStudentId(),
					parentPassword: body.parentPassword
						? hashPassword(body.parentPassword)
						: null,
					umur: body.umur,
					hafalan: body.hafalan ?? 0,
					target: body.target ?? 0,
					mulaiHafalan: body.mulaiHafalan,
					metodeProgress: body.metodeProgress ?? "juz",
					ziyadah: body.ziyadah ?? 1,
					murajaah: body.murajaah ?? 1,
					terakhirIjazah: body.terakhirIjazah,
				})
				.returning();
			return Response.json(row, { status: 201 });
			},

			PUT: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				const body = await request.json();
				if (!body.id)
					return Response.json({ error: "id required" }, { status: 400 });

				const [owned] = await db
					.select({ id: siswa.id })
					.from(siswa)
					.where(
						and(eq(siswa.id, body.id), eq(siswa.musyrifId, session.user.id)),
					)
					.limit(1);
				if (!owned)
					return Response.json({ error: "Forbidden" }, { status: 403 });

				const updateData: Record<string, unknown> = {
					nama: body.nama,
					umur: body.umur,
					hafalan: body.hafalan,
					target: body.target,
					mulaiHafalan: body.mulaiHafalan,
					metodeProgress: body.metodeProgress,
					ziyadah: body.ziyadah,
					murajaah: body.murajaah,
					terakhirIjazah: body.terakhirIjazah,
					updatedAt: new Date(),
				};

				if (body.parentPassword !== undefined) {
					updateData.parentPassword = body.parentPassword
						? hashPassword(body.parentPassword)
						: null;
				}

				const [row] = await db
					.update(siswa)
					.set(updateData)
					.where(eq(siswa.id, body.id))
					.returning();
				return Response.json(row);
			},

			DELETE: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				const { searchParams } = new URL(request.url);
				const id = searchParams.get("id");
				if (!id)
					return Response.json({ error: "id required" }, { status: 400 });

				const [owned] = await db
					.select({ id: siswa.id })
					.from(siswa)
					.where(and(eq(siswa.id, id), eq(siswa.musyrifId, session.user.id)))
					.limit(1);
				if (!owned)
					return Response.json({ error: "Forbidden" }, { status: 403 });

				await db.delete(siswa).where(eq(siswa.id, id));
				return Response.json({ ok: true });
			},
		},
	},
});
