import { createFileRoute } from "@tanstack/react-router";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { presensi, setoran, siswa } from "@/lib/db/schema";
import { SURAH_DATA } from "@/lib/surah-data";

export const Route = createFileRoute("/api/setoran")({
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
					const siswaId = searchParams.get("siswaId");
					const tanggalAwal = searchParams.get("tanggalAwal");
					const tanggalAkhir = searchParams.get("tanggalAkhir");

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
				} catch (e) {
					console.error("GET /api/setoran error:", e);
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

					const lintas = body.lintas === true;
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
						// for lintas, validate ayatAkhir against end surah
						const endSurahData = lintas
							? SURAH_DATA.find((s) => s.number === body.surahAkhir)
							: surahData;
						if (endSurahData && body.ayatAkhir > endSurahData.ayatCount) {
							return Response.json(
								{
									error: `Ayat akhir melebihi jumlah ayat ${endSurahData.name} (${endSurahData.ayatCount} ayat)`,
								},
								{ status: 400 },
							);
						}
					}

					// pre-compute juz range for lintas records
					let juz = body.juz;
					if (lintas && !juz) {
						const sStart = SURAH_DATA.find((s) => s.number === body.surah);
						const sEnd = SURAH_DATA.find((s) => s.number === body.surahAkhir);
						if (sStart && sEnd) {
							juz =
								sStart.juzStart === sEnd.juzEnd
									? `${sStart.juzStart}`
									: `${sStart.juzStart}-${sEnd.juzEnd}`;
						}
					}

					const [row] = await db
						.insert(setoran)
						.values({
							siswaId: body.siswaId,
							type: body.type,
							tanggal: body.tanggal,
							surah: body.surah,
							surahAkhir: lintas ? (body.surahAkhir ?? null) : null,
							lintas,
							ayatAwal: body.ayatAwal,
							ayatAkhir: body.ayatAkhir,
							juz,
							isMutqin: body.isMutqin ?? false,
							status: body.status ?? "Tidak Lancar",
							catatan: body.catatan,
						})
						.returning();

					// Auto-mark present: if no presensi yet for this date, insert "Hadir"
					const [existingPresensi] = await db
						.select({ id: presensi.id })
						.from(presensi)
						.where(
							and(
								eq(presensi.siswaId, body.siswaId),
								eq(presensi.tanggal, body.tanggal),
							),
						)
						.limit(1);
					if (!existingPresensi) {
						await db.insert(presensi).values({
							siswaId: body.siswaId,
							tanggal: body.tanggal,
							status: "Hadir",
						});
					}

					return Response.json(row, { status: 201 });
				} catch (e) {
					console.error("POST /api/setoran error:", e);
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

					const lintas = body.lintas === true;
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
						const endSurahData = lintas
							? SURAH_DATA.find((s) => s.number === body.surahAkhir)
							: surahData;
						if (endSurahData && body.ayatAkhir > endSurahData.ayatCount) {
							return Response.json(
								{
									error: `Ayat akhir melebihi jumlah ayat ${endSurahData.name} (${endSurahData.ayatCount} ayat)`,
								},
								{ status: 400 },
							);
						}
					}

					// pre-compute juz range for lintas records
					let juz = body.juz;
					if (lintas && !juz) {
						const sStart = SURAH_DATA.find((s) => s.number === body.surah);
						const sEnd = SURAH_DATA.find((s) => s.number === body.surahAkhir);
						if (sStart && sEnd) {
							juz =
								sStart.juzStart === sEnd.juzEnd
									? `${sStart.juzStart}`
									: `${sStart.juzStart}-${sEnd.juzEnd}`;
						}
					}

					const [row] = await db
						.update(setoran)
						.set({
							type: body.type,
							tanggal: body.tanggal,
							surah: body.surah,
							surahAkhir: lintas ? (body.surahAkhir ?? null) : null,
							lintas,
							ayatAwal: body.ayatAwal,
							ayatAkhir: body.ayatAkhir,
							juz,
							isMutqin: body.isMutqin,
							status: body.status,
							catatan: body.catatan,
						})
						.where(eq(setoran.id, body.id))
						.returning();
					return Response.json(row);
				} catch (e) {
					console.error("PUT /api/setoran error:", e);
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
				} catch (e) {
					console.error("DELETE /api/setoran error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
