import { createFileRoute } from "@tanstack/react-router";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { setoran, siswa } from "@/lib/db/schema";
import { SURAH_DATA } from "@/lib/surah-data";

export const Route = createFileRoute("/api/setoran")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				const { searchParams } = new URL(request.url);
				const siswaId = searchParams.get("siswaId");
				const tanggalAwal = searchParams.get("tanggalAwal");
				const tanggalAkhir = searchParams.get("tanggalAkhir");

				// Get siswa IDs belonging to this musyrif
				const mySiswa = await db
					.select({ id: siswa.id })
					.from(siswa)
					.where(eq(siswa.musyrifId, session.user.id));
				const siswaIds = mySiswa.map((s) => s.id);

				if (siswaIds.length === 0) return Response.json([]);

				const conditions = [inArray(setoran.siswaId, siswaIds)];
				if (siswaId) {
					conditions.length = 0;
					conditions.push(eq(setoran.siswaId, siswaId));
				}
				if (tanggalAwal) conditions.push(gte(setoran.tanggal, tanggalAwal));
				if (tanggalAkhir) conditions.push(lte(setoran.tanggal, tanggalAkhir));

				const rows = await db
					.select()
					.from(setoran)
					.where(and(...conditions))
					.orderBy(setoran.tanggal);

				return Response.json(rows);
			},

			POST: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
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

				const surahData = SURAH_DATA.find((s) => s.number === body.surah);
				if (surahData) {
					if (body.ayatAwal > surahData.ayatCount) {
						return Response.json(
							{
								error: `Ayat awal melebihi jumlah ayat ${surahData.name} (${surahData.ayatCount} ayat)`,
							},
							{ status: 400 },
						);
					}
					if (body.ayatAkhir > surahData.ayatCount) {
						return Response.json(
							{
								error: `Ayat akhir melebihi jumlah ayat ${surahData.name} (${surahData.ayatCount} ayat)`,
							},
							{ status: 400 },
						);
					}
				}

				const [row] = await db
					.insert(setoran)
					.values({
						siswaId: body.siswaId,
						type: body.type,
						tanggal: body.tanggal,
						surah: body.surah,
						ayatAwal: body.ayatAwal,
						ayatAkhir: body.ayatAkhir,
						status: body.status ?? "Tidak Lancar",
						catatan: body.catatan,
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

				const [existing] = await db
					.select({ siswaId: setoran.siswaId })
					.from(setoran)
					.where(eq(setoran.id, body.id))
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

				const surahData = SURAH_DATA.find((s) => s.number === body.surah);
				if (surahData) {
					if (body.ayatAwal > surahData.ayatCount) {
						return Response.json(
							{
								error: `Ayat awal melebihi jumlah ayat ${surahData.name} (${surahData.ayatCount} ayat)`,
							},
							{ status: 400 },
						);
					}
					if (body.ayatAkhir > surahData.ayatCount) {
						return Response.json(
							{
								error: `Ayat akhir melebihi jumlah ayat ${surahData.name} (${surahData.ayatCount} ayat)`,
							},
							{ status: 400 },
						);
					}
				}

				const [row] = await db
					.update(setoran)
					.set({
						type: body.type,
						tanggal: body.tanggal,
						surah: body.surah,
						ayatAwal: body.ayatAwal,
						ayatAkhir: body.ayatAkhir,
						status: body.status,
						catatan: body.catatan,
					})
					.where(eq(setoran.id, body.id))
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

				const [existing] = await db
					.select({ siswaId: setoran.siswaId })
					.from(setoran)
					.where(eq(setoran.id, id))
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

				await db.delete(setoran).where(eq(setoran.id, id));
				return Response.json({ ok: true });
			},
		},
	},
});
