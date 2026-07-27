import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { setoran, siswa, userProfile } from "@/lib/db/schema";
import { SURAH_DATA } from "@/lib/surah-data";

export const Route = createFileRoute("/api/export-pdf")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				});
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				const body = await request.json();
				const { type, siswaId } = body as {
					type: "laporan" | "siswa";
					siswaId?: string;
				};

				// Get siswa belonging to this musyrif
				const mySiswa = await db
					.select()
					.from(siswa)
					.where(eq(siswa.musyrifId, session.user.id));
				const siswaIds = mySiswa.map((s) => s.id);
				if (siswaIds.length === 0)
					return Response.json({ error: "No siswa" }, { status: 404 });

				// Get setoran
				const allSetoran = await db
					.select()
					.from(setoran)
					.where(inArray(setoran.siswaId, siswaIds))
					.orderBy(setoran.tanggal);

				// Get profile for halaqah name
				const [profile] = await db
					.select()
					.from(userProfile)
					.where(eq(userProfile.id, session.user.id));
				const halaqahName = profile?.nama || "Halaqah Tahsin";

				const now = new Date();
				const dateStr = now.toLocaleDateString("id-ID", {
					month: "long",
					year: "numeric",
				});

				let content: unknown[];
				let title: string;
				let subtitle: string;

				if (type === "siswa" && siswaId) {
					// Single student report
					const s = mySiswa.find((x) => x.id === siswaId);
					if (!s)
						return Response.json({ error: "Siswa not found" }, { status: 404 });

					const recs = allSetoran.filter((r) => r.siswaId === siswaId);
					const totalAyat = recs.reduce(
						(sum, r) => sum + (r.ayatAkhir - r.ayatAwal + 1),
						0,
					);
					const mutqinCount = recs.filter((r) => r.isMutqin).length;

					title = `Rapor — ${s.nama}`;
					subtitle = `${halaqahName}`;
					content = [
						{
							type: "h2",
							text: `Rapor Hafalan — ${s.nama}`,
						},
						{
							type: "table",
							style: "summary",
							headers: ["Metrik", "Nilai"],
							rows: [
								["Total Setoran", `${recs.length}`],
								["Total Ayat", `${totalAyat}`],
								["Mutqin", `${mutqinCount}`],
								[
									"Metode",
									s.metodeProgress === "juz" ? "Per Juz" : "Per Halaman",
								],
							],
						},
						{ type: "divider" },
						{ type: "h2", text: "Riwayat Setoran" },
						{
							type: "table",
							style: "detail",
							headers: ["Tanggal", "Type", "Surah", "Ayat", "Status", "Mutqin"],
							rows: recs
								.slice()
								.reverse()
								.map((r) => {
									const sData = SURAH_DATA.find((x) => x.number === r.surah);
									return [
										r.tanggal,
										r.type,
										sData?.name || `Surah ${r.surah}`,
										`${r.ayatAwal}-${r.ayatAkhir}`,
										r.status,
										r.isMutqin ? "Ya" : "",
									];
								}),
						},
					];
				} else {
					// Laporan — all students
					title = `Laporan Hafalan`;
					subtitle = `${halaqahName} — ${dateStr}`;

					const summaryRows = mySiswa.map((s) => {
						const recs = allSetoran.filter((r) => r.siswaId === s.id);
						const totalAyat = recs.reduce(
							(sum, r) => sum + (r.ayatAkhir - r.ayatAwal + 1),
							0,
						);
						const lastRec = recs[recs.length - 1];
						const lastSurah = lastRec
							? SURAH_DATA.find((x) => x.number === lastRec.surah)
							: null;
						const lastAyat = lastRec
							? `${lastSurah?.name || `Surah ${lastRec.surah}`} ${lastRec.ayatAwal}-${lastRec.ayatAkhir}`
							: "-";
						return [
							s.nama,
							`${recs.length} setoran`,
							`${totalAyat} ayat`,
							lastAyat,
							s.metodeProgress === "juz" ? "Juz" : "Halaman",
						];
					});

					content = [
						{ type: "h2", text: "Ringkasan Laporan" },
						{
							type: "table",
							style: "summary",
							headers: ["Siswa", "Setoran", "Total Ayat", "Terakhir", "Metode"],
							rows: summaryRows,
						},
						{ type: "divider" },
						{ type: "h2", text: "Detail Per Siswa" },
					];

					// Add per-student sections
					for (const s of mySiswa) {
						const recs = allSetoran
							.filter((r) => r.siswaId === s.id)
							.slice()
							.reverse();
						content.push({
							type: "h3",
							text: `${s.nama} — ${recs.length} setoran`,
						});
						if (recs.length > 0) {
							content.push({
								type: "table",
								style: "detail",
								headers: ["Tanggal", "Type", "Surah", "Ayat", "Status"],
								rows: recs.map((r) => {
									const sData = SURAH_DATA.find((x) => x.number === r.surah);
									return [
										r.tanggal,
										r.type,
										sData?.name || `Surah ${r.surah}`,
										`${r.ayatAwal}-${r.ayatAkhir}`,
										r.status,
									];
								}),
							});
						} else {
							content.push({ type: "body", text: "Belum ada setoran." });
						}
					}
				}

				// Build content JSON and run PDF generator
				const tmpDir = mkdtempSync(join(tmpdir(), "pdf-"));
				const contentPath = join(tmpDir, "content.json");
				const outPath = join(tmpDir, "report.pdf");
				const scriptPath = join(process.cwd(), "scripts", "generate-pdf.py");

				try {
					writeFileSync(
						contentPath,
						JSON.stringify({ title, subtitle, date: dateStr, content }),
					);

					execSync(
						`python3 "${scriptPath}" --title "${title.replace(/"/g, '\\"')}" --subtitle "${subtitle.replace(/"/g, '\\"')}" --date "${dateStr}" --content "${contentPath}" --out "${outPath}"`,
						{ timeout: 15000 },
					);

					const pdfBuffer = readFileSync(outPath);
					return new Response(pdfBuffer, {
						headers: {
							"Content-Type": "application/pdf",
							"Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`,
						},
					});
				} catch (err) {
					console.error("PDF generation failed:", err);
					return Response.json(
						{ error: "PDF generation failed" },
						{ status: 500 },
					);
				} finally {
					rmSync(tmpDir, { recursive: true, force: true });
				}
			},
		},
	},
});
