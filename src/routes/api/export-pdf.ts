import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { appConfig, setoran, siswa, userProfile } from "@/lib/db/schema";
import { SURAH_DATA } from "@/lib/surah-data";

// ponytail: page calculation uses proportional mapping from SURAH_DATA
// pageStart/pageEnd are from api.islamic.app /v1/chapters (Madinah mushaf 604 pages)
function calcHalaman(
	surahNum: number,
	ayatAwal: number,
	ayatAkhir: number,
): number {
	const sData = SURAH_DATA.find((x) => x.number === surahNum);
	if (!sData) return 0;
	const ayatCovered = ayatAkhir - ayatAwal + 1;
	const surahPages = sData.pageEnd - sData.pageStart + 1;
	return Math.max(1, Math.ceil((ayatCovered / sData.ayatCount) * surahPages));
}

function calcLintasHalaman(
	startSurah: number,
	startAyat: number,
	endSurah: number,
	endAyat: number,
): number {
	let total = 0;
	for (let sn = startSurah; sn <= endSurah; sn++) {
		const sData = SURAH_DATA.find((x) => x.number === sn);
		if (!sData) continue;
		const isFirst = sn === startSurah;
		const isLast = sn === endSurah;
		const from = isFirst ? startAyat : 1;
		const to = isLast ? endAyat : sData.ayatCount;
		const covered = to - from + 1;
		const pages = sData.pageEnd - sData.pageStart + 1;
		total += Math.max(1, Math.ceil((covered / sData.ayatCount) * pages));
	}
	return total;
}

function calcLintasAyat(
	startSurah: number,
	startAyat: number,
	endSurah: number,
	endAyat: number,
): number {
	let total = 0;
	for (let sn = startSurah; sn <= endSurah; sn++) {
		const sData = SURAH_DATA.find((x) => x.number === sn);
		if (!sData) continue;
		const isFirst = sn === startSurah;
		const isLast = sn === endSurah;
		const from = isFirst ? startAyat : 1;
		const to = isLast ? endAyat : sData.ayatCount;
		total += to - from + 1;
	}
	return total;
}

function calcJuz(
	surahNum: number,
	ayatAwal: number,
	ayatAkhir: number,
): string {
	const sData = SURAH_DATA.find((x) => x.number === surahNum);
	if (!sData) return "-";
	if (sData.juzStart === sData.juzEnd) return `${sData.juzStart}`;
	const progress = (ayatAwal + ayatAkhir) / 2 / sData.ayatCount;
	const juz = Math.round(
		sData.juzStart + progress * (sData.juzEnd - sData.juzStart),
	);
	return `${juz}`;
}

function surahName(surahNum: number): string {
	return (
		SURAH_DATA.find((x) => x.number === surahNum)?.name || `Surah ${surahNum}`
	);
}

function surahRangeName(start: number, end: number): string {
	if (start === end) return surahName(start);
	return `${surahName(start)} → ${surahName(end)}`;
}

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
				const { type, siswaId, periode } = body as {
					type: "laporan" | "siswa";
					siswaId?: string;
					periode?: string;
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

				// Get profile for halaqah name & guru name
				const [profile] = await db
					.select()
					.from(userProfile)
					.where(eq(userProfile.id, session.user.id));
				const halaqahName = profile?.halaqahName || "Halaqah Tahsin";
				const guruName = profile?.nama || session.user.name || "Ustadz";

				// Get school profile from appConfig
				const configRows = await db.select().from(appConfig);
				const configByKey: Record<string, string> = {};
				for (const r of configRows) configByKey[r.key] = r.value ?? "";
				const schoolLogo = configByKey.SCHOOL_LOGO ?? "";
				const schoolFoundationName = configByKey.SCHOOL_FOUNDATION_NAME ?? "";
				const schoolName = configByKey.SCHOOL_NAME ?? "";

				const now = new Date();
				const dateStr = now.toLocaleDateString("id-ID", {
					month: "long",
					year: "numeric",
				});

				let content: unknown[];
				let title: string;
				let subtitle: string;
				let siswaName = "";
				let totalSetoran = 0;
				let summaryTotalAyat = 0;
				let summaryTotalHalaman = 0;
				let summaryJuz = "-";
				let summaryTerakhir = "-";

				if (type === "siswa" && siswaId) {
					// Single student report
					const s = mySiswa.find((x) => x.id === siswaId);
					if (!s)
						return Response.json({ error: "Siswa not found" }, { status: 404 });

					siswaName = s.nama;
					const recs = allSetoran.filter((r) => r.siswaId === siswaId);
					totalSetoran = recs.length;
					summaryTotalAyat = recs.reduce((sum, r) => {
						if (r.lintas && r.surahAkhir)
							return (
								sum +
								calcLintasAyat(r.surah, r.ayatAwal, r.surahAkhir, r.ayatAkhir)
							);
						return sum + (r.ayatAkhir - r.ayatAwal + 1);
					}, 0);
					summaryTotalHalaman = recs.reduce((sum, r) => {
						if (r.lintas && r.surahAkhir)
							return (
								sum +
								calcLintasHalaman(
									r.surah,
									r.ayatAwal,
									r.surahAkhir,
									r.ayatAkhir,
								)
							);
						return sum + calcHalaman(r.surah, r.ayatAwal, r.ayatAkhir);
					}, 0);
					const lastRec = recs.length > 0 ? recs[recs.length - 1] : null;
					summaryJuz = lastRec
						? lastRec.juz ||
							calcJuz(lastRec.surah, lastRec.ayatAwal, lastRec.ayatAkhir)
						: "-";
					summaryTerakhir = lastRec
						? lastRec.lintas && lastRec.surahAkhir
							? `${surahRangeName(lastRec.surah, lastRec.surahAkhir)} ${lastRec.ayatAwal}–${lastRec.ayatAkhir}`
							: `${surahName(lastRec.surah)} ${lastRec.ayatAwal}–${lastRec.ayatAkhir}`
						: "-";

					title = `Rapor — ${s.nama}`;
					subtitle = `${halaqahName}`;
					content = [
						{ type: "h2", text: "Riwayat Setoran" },
						{
							type: "table",
							style: "detail",
							headers: [
								"Tanggal",
								"Type",
								"Surah",
								"Ayat",
								"Juz",
								"Halaman",
								"Grade",
								"Catatan",
							],
							rows: recs
								.slice()
								.reverse()
								.map((r) => {
									const isLintas = r.lintas && r.surahAkhir;
									const halaman = isLintas
										? calcLintasHalaman(
												r.surah,
												r.ayatAwal,
												r.surahAkhir,
												r.ayatAkhir,
											)
										: calcHalaman(r.surah, r.ayatAwal, r.ayatAkhir);
									const juz =
										r.juz || calcJuz(r.surah, r.ayatAwal, r.ayatAkhir);
									const sName = isLintas
										? surahRangeName(r.surah, r.surahAkhir)
										: surahName(r.surah);
									return [
										r.tanggal,
										r.type,
										sName,
										`${r.ayatAwal}–${r.ayatAkhir}`,
										juz,
										`${halaman}`,
										r.status,
										r.catatan || "",
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
						const totalAyat = recs.reduce((sum, r) => {
							if (r.lintas && r.surahAkhir)
								return (
									sum +
									calcLintasAyat(r.surah, r.ayatAwal, r.surahAkhir, r.ayatAkhir)
								);
							return sum + (r.ayatAkhir - r.ayatAwal + 1);
						}, 0);
						const totalHalaman = recs.reduce((sum, r) => {
							if (r.lintas && r.surahAkhir)
								return (
									sum +
									calcLintasHalaman(
										r.surah,
										r.ayatAwal,
										r.surahAkhir,
										r.ayatAkhir,
									)
								);
							return sum + calcHalaman(r.surah, r.ayatAwal, r.ayatAkhir);
						}, 0);
						const lastRec = recs[recs.length - 1];
						const lastAyat = lastRec
							? lastRec.lintas && lastRec.surahAkhir
								? `${surahRangeName(lastRec.surah, lastRec.surahAkhir)} ${lastRec.ayatAwal}–${lastRec.ayatAkhir}`
								: `${surahName(lastRec.surah)} ${lastRec.ayatAwal}–${lastRec.ayatAkhir}`
							: "-";
						return [
							s.nama,
							`${recs.length}`,
							`${totalAyat}`,
							`${totalHalaman}`,
							lastAyat,
							s.metodeProgress === "juz" ? "Juz" : "Halaman",
						];
					});

					content = [
						{ type: "h2", text: "Ringkasan Laporan" },
						{
							type: "table",
							style: "summary",
							headers: [
								"Siswa",
								"Setoran",
								"Ayat",
								"Halaman",
								"Terakhir",
								"Metode",
							],
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
								headers: [
									"Tanggal",
									"Type",
									"Surah",
									"Ayat",
									"Juz",
									"Halaman",
									"Grade",
									"Catatan",
								],
								rows: recs.map((r) => {
									const isLintas = r.lintas && r.surahAkhir;
									const halaman = isLintas
										? calcLintasHalaman(
												r.surah,
												r.ayatAwal,
												r.surahAkhir,
												r.ayatAkhir,
											)
										: calcHalaman(r.surah, r.ayatAwal, r.ayatAkhir);
									const juz =
										r.juz || calcJuz(r.surah, r.ayatAwal, r.ayatAkhir);
									const sName = isLintas
										? surahRangeName(r.surah, r.surahAkhir)
										: surahName(r.surah);
									return [
										r.tanggal,
										r.type,
										sName,
										`${r.ayatAwal}–${r.ayatAkhir}`,
										juz,
										`${halaman}`,
										r.status,
										r.catatan || "",
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

				// Determine period display
				const monthStr = periode
					? new Date(`${periode}-01`).toLocaleDateString("id-ID", {
							month: "long",
							year: "numeric",
						})
					: dateStr;

				try {
					writeFileSync(
						contentPath,
						JSON.stringify({
							title,
							subtitle,
							date: dateStr,
							content,
							schoolLogo,
							schoolFoundationName,
							schoolName,
							guruName,
							halaqahName,
							periode: monthStr,
							siswaName,
							totalSetoran,
							totalAyat: summaryTotalAyat,
							totalHalaman: summaryTotalHalaman,
							currentJuz: summaryJuz,
							lastMemorization: summaryTerakhir,
						}),
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
