import { createFileRoute } from "@tanstack/react-router";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { presensi, siswa } from "@/lib/db/schema";

export const Route = createFileRoute("/api/presensi")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const session = await auth.api.getSession({
						headers: request.headers,
					});
					if (!session)
						return Response.json({ error: "Unauthorized" }, { status: 401 });

					const { searchParams } = new URL(request.url);
					const tanggal = searchParams.get("tanggal");
					const tanggalAwal = searchParams.get("tanggalAwal");
					const tanggalAkhir = searchParams.get("tanggalAkhir");

					const mySiswa = await db
						.select({ id: siswa.id })
						.from(siswa)
						.where(eq(siswa.musyrifId, session.user.id));
					const siswaIds = mySiswa.map((s) => s.id);

					if (siswaIds.length === 0) return Response.json([]);

					const conditions = [inArray(presensi.siswaId, siswaIds)];
					if (tanggal) {
						conditions.length = 0;
						conditions.push(eq(presensi.tanggal, tanggal));
						conditions.push(inArray(presensi.siswaId, siswaIds));
					}
					if (tanggalAwal) conditions.push(gte(presensi.tanggal, tanggalAwal));
					if (tanggalAkhir)
						conditions.push(lte(presensi.tanggal, tanggalAkhir));

					const rows = await db
						.select()
						.from(presensi)
						.where(and(...conditions));

					return Response.json(rows);
				} catch (e) {
					console.error("GET /api/presensi error:", e);
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
					const [owned] = await db
						.select({ id: siswa.id })
						.from(siswa)
						.where(
							and(
								eq(siswa.id, body.siswaId),
								eq(siswa.musyrifId, session.user.id),
							),
						)
						.limit(1);
					if (!owned)
						return Response.json({ error: "Forbidden" }, { status: 403 });

					const [row] = await db
						.insert(presensi)
						.values({
							siswaId: body.siswaId,
							tanggal: body.tanggal,
							status: body.status ?? "Hadir",
						})
						.returning();
					return Response.json(row, { status: 201 });
				} catch (e) {
					console.error("POST /api/presensi error:", e);
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
					if (!body.id)
						return Response.json({ error: "id required" }, { status: 400 });

					const [existing] = await db
						.select({ siswaId: presensi.siswaId })
						.from(presensi)
						.where(eq(presensi.id, body.id))
						.limit(1);
					if (!existing)
						return Response.json({ error: "Not found" }, { status: 404 });
					const [owned] = await db
						.select({ id: siswa.id })
						.from(siswa)
						.where(
							and(
								eq(siswa.id, existing.siswaId),
								eq(siswa.musyrifId, session.user.id),
							),
						)
						.limit(1);
					if (!owned)
						return Response.json({ error: "Forbidden" }, { status: 403 });

					const [row] = await db
						.update(presensi)
						.set({ status: body.status })
						.where(eq(presensi.id, body.id))
						.returning();
					return Response.json(row);
				} catch (e) {
					console.error("PUT /api/presensi error:", e);
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

					const [existing] = await db
						.select({ siswaId: presensi.siswaId })
						.from(presensi)
						.where(eq(presensi.id, id))
						.limit(1);
					if (!existing)
						return Response.json({ error: "Not found" }, { status: 404 });
					const [owned] = await db
						.select({ id: siswa.id })
						.from(siswa)
						.where(
							and(
								eq(siswa.id, existing.siswaId),
								eq(siswa.musyrifId, session.user.id),
							),
						)
						.limit(1);
					if (!owned)
						return Response.json({ error: "Forbidden" }, { status: 403 });

					await db.delete(presensi).where(eq(presensi.id, id));
					return Response.json({ ok: true });
				} catch (e) {
					console.error("DELETE /api/presensi error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
