import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { presensi, siswa, userProfile } from "@/lib/db/schema";

export const Route = createFileRoute("/api/export-presensi")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				});
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				const body = await request.json();
				const { tanggalAwal, tanggalAkhir, siswaIds } = body as {
					tanggalAwal: string;
					tanggalAkhir: string;
					siswaIds: string[];
				};

				if (!tanggalAwal || !tanggalAkhir) {
					return Response.json(
						{ error: "Tanggal awal dan akhir diperlukan" },
						{ status: 400 },
					);
				}

				// Fetch students
				const mySiswa = await db
					.select()
					.from(siswa)
					.where(eq(siswa.musyrifId, session.user.id));

				const selectedSiswa =
					siswaIds.length > 0
						? mySiswa.filter((s) => siswaIds.includes(s.id))
						: mySiswa;

				if (selectedSiswa.length === 0) {
					return Response.json(
						{
							error: "no_data",
							message: "Tidak ada data presensi untuk siswa yang dipilih",
						},
						{ status: 404 },
					);
				}

				const selectedIds = selectedSiswa.map((s) => s.id);

				// Fetch presensi
				const presensiRows = await db
					.select()
					.from(presensi)
					.where(
						and(
							inArray(presensi.siswaId, selectedIds),
							gte(presensi.tanggal, tanggalAwal),
							lte(presensi.tanggal, tanggalAkhir),
						),
					)
					.orderBy(presensi.tanggal);

				if (presensiRows.length === 0) {
					return Response.json(
						{
							error: "no_data",
							message: "Tidak ada data presensi untuk periode ini",
						},
						{ status: 404 },
					);
				}

				// Fetch profile for metadata
				const [profile] = await db
					.select()
					.from(userProfile)
					.where(eq(userProfile.id, session.user.id))
					.limit(1);

				const halaqahName = profile?.halaqahName || profile?.nama || "Halaqah";
				const siswaName = selectedSiswa.map((s) => s.nama).join(", ");

				// Format dates for display
				const fmtDate = (d: string) =>
					new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
						day: "numeric",
						month: "short",
						year: "numeric",
					});

				const title = "Laporan Presensi";
				const subtitle = `${halaqahName} — ${siswaName}`;
				const dateStr = `${fmtDate(tanggalAwal)} — ${fmtDate(tanggalAkhir)}`;

				// ── Content blocks ──────────────────────────────────────────

				const statuses = ["Hadir", "Izin", "Sakit", "Alpha"] as const;
				const totalCount = presensiRows.length;

				// Global summary
				const summaryRows = statuses.map((st) => {
					const count = presensiRows.filter((r) => r.status === st).length;
					const pct =
						totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
					return [st, `${count}`, `${pct}%`];
				});

				// Per-student summary
				const perSiswaRows = selectedSiswa.map((s) => {
					const rows = presensiRows.filter((r) => r.siswaId === s.id);
					const total = rows.length;
					const counts = statuses.map(
						(st) => rows.filter((r) => r.status === st).length,
					);
					return [
						s.nama,
						...counts.map(String),
						String(total),
						total > 0 ? `${Math.round((counts[0] / total) * 100)}%` : "0%",
					];
				});

				// Group by month for detail
				const monthGroups: Record<string, typeof presensiRows> = {};
				for (const row of presensiRows) {
					const key = row.tanggal.substring(0, 7); // "2024-01"
					if (!monthGroups[key]) monthGroups[key] = [];
					monthGroups[key].push(row);
				}

				const bulanNames = [
					"Januari",
					"Februari",
					"Maret",
					"April",
					"Mei",
					"Juni",
					"Juli",
					"Agustus",
					"September",
					"Oktober",
					"November",
					"Desember",
				];

				const content = [
					{ type: "h2" as const, text: "Laporan Presensi" },
					{
						type: "callout" as const,
						text: `${dateStr} · ${selectedSiswa.length} siswa · ${totalCount} presensi`,
					},
					{ type: "h3" as const, text: "Ringkasan Kehadiran" },
					{
						type: "table" as const,
						style: "summary",
						headers: ["Status", "Jumlah", "Persentase"],
						rows: summaryRows,
					},
					{ type: "divider" as const },
					{ type: "h3" as const, text: "Per Siswa" },
					{
						type: "table" as const,
						style: "summary",
						headers: [
							"Siswa",
							"Hadir",
							"Izin",
							"Sakit",
							"Alpha",
							"Total",
							"% Hadir",
						],
						rows: perSiswaRows,
					},
				];

				// Monthly detail
				if (Object.keys(monthGroups).length > 1) {
					content.push({ type: "pagebreak" as const });
				}
				content.push({ type: "h2" as const, text: "Detail Presensi" });

				const sortedMonths = Object.keys(monthGroups).sort();
				for (const monthKey of sortedMonths) {
					const [y, m] = monthKey.split("-");
					const monthName = `${bulanNames[Number.parseInt(m ?? "1", 10) - 1]} ${y}`;

					content.push({
						type: "h3" as const,
						text: monthName,
					});

					const monthData = monthGroups[monthKey];
					if (!monthData) continue;
					const monthRows = monthData.map((r) => {
						const s = selectedSiswa.find((x) => x.id === r.siswaId);
						return [fmtDate(r.tanggal), s?.nama ?? "—", r.status];
					});

					content.push({
						type: "table" as const,
						style: "detail",
						headers: ["Tanggal", "Siswa", "Status"],
						rows: monthRows,
					});
				}

				// ── Run PDF generator ──────────────────────────────────────────

				const tmpDir = mkdtempSync(join(tmpdir(), "presensi-"));
				const contentPath = join(tmpDir, "content.json");
				const outPath = join(tmpDir, "report.pdf");
				const scriptPath = join(process.cwd(), "scripts", "generate-pdf.py");

				try {
					writeFileSync(
						contentPath,
						JSON.stringify({ title, subtitle, date: dateStr, content }),
					);

					const esc = (s: string) => s.replace(/"/g, '\\"');
					execSync(
						`python3 "${scriptPath}" --title "${esc(title)}" --subtitle "${esc(subtitle)}" --date "${esc(dateStr)}" --content "${contentPath}" --out "${outPath}"`,
						{ timeout: 15000 },
					);

					const pdfBuffer = readFileSync(outPath);
					return new Response(pdfBuffer, {
						headers: {
							"Content-Type": "application/pdf",
							"Content-Disposition": `attachment; filename="Presensi_${tanggalAwal}_${tanggalAkhir}.pdf"`,
						},
					});
				} catch (err) {
					console.error("Presensi PDF generation failed:", err);
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
