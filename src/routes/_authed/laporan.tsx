import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";
import { PresensiExportDialog } from "@/components/presensi-export-dialog";
import { StudentModal } from "@/components/student-modal";
import { Button } from "@/components/ui/button";
import { calcProgress } from "@/lib/progress";
import { SURAH_DATA } from "@/lib/surah-data";

interface Siswa {
	id: string;
	nama: string;
	hafalan: number;
	target: number;
	mulaiHafalan?: string | null;
	metodeProgress?: string;
}

interface Setoran {
	id: string;
	siswaId: string;
	type: string;
	tanggal: string;
	surah: number;
	ayatAwal: number;
	ayatAkhir: number;
	status: string;
	catatan?: string;
	isMutqin?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
	Lancar: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
	"Mulai Lancar": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
	"Tidak Lancar": "bg-red-500/15 text-red-700 dark:text-red-400",
};

const PIE_COLORS = ["#2563eb", "#f59e0b", "#ef4444"];

const AVATAR_COLORS: Record<string, string[]> = {
	a: ["#f0fdf4", "#166534"],
	b: ["#eff6ff", "#1e40af"],
	c: ["#fefce8", "#854d0e"],
};

function getAvatarColors(n: string): [string, string] {
	return (
		(AVATAR_COLORS[(n[0] || "a").toLowerCase()] as [string, string]) || [
			"#f0fdf4",
			"#1a5c5c",
		]
	);
}

export const Route = createFileRoute("/_authed/laporan")({
	component: LaporanPage,
});

function LaporanPage() {
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [setoranList, setSetoranList] = useState<Setoran[]>([]);
	const [view, setView] = useState<"grid" | "list">("grid");
	const [selectedSiswa, setSelectedSiswa] = useState<string | null>(null);
	const [modalSiswa, setModalSiswa] = useState<Siswa | null>(null);
	const [halaqahName, setHalaqahName] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [presensiExportOpen, setPresensiExportOpen] = useState(false);

	useEffect(() => {
		async function load() {
			try {
				const [sRes, stRes, pRes] = await Promise.all([
					fetch("/api/siswa"),
					fetch("/api/setoran"),
					fetch("/api/user-profile"),
				]);
				if (sRes.ok) setSiswaList(await sRes.json());
				if (stRes.ok) setSetoranList(await stRes.json());
				if (pRes.ok) {
					const profile = await pRes.json();
					if (profile?.halaqah) setHalaqahName(profile.halaqah);
				}
			} catch {}
			setLoading(false);
		}
		load();
	}, []);

	const filteredSetoran = selectedSiswa
		? setoranList.filter((r) => r.siswaId === selectedSiswa)
		: setoranList;

	const now = new Date();
	const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
	const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
	const monthlySetoran = filteredSetoran.filter(
		(r) => r.tanggal >= monthStart && r.tanggal <= monthEnd,
	);

	const statusCounts = monthlySetoran.reduce(
		(acc, r) => {
			acc[r.status] = (acc[r.status] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
	const pieData = Object.entries(statusCounts).map(([name, value]) => ({
		name,
		value,
	}));

	const weeklyTrend = getWeeklyTrend(filteredSetoran);

	// Monthly insight computations
	const uniqueJuzSet = new Set<number>();
	monthlySetoran.forEach((r) => {
		const surah = SURAH_DATA.find((s) => s.number === r.surah);
		if (surah) {
			for (let j = surah.juzStart; j <= surah.juzEnd; j++) uniqueJuzSet.add(j);
		}
	});
	const juzCompleted = uniqueJuzSet.size;

	const topGrade =
		monthlySetoran.find((r) => r.status === "Lancar")?.status ||
		monthlySetoran.find((r) => r.status === "Mulai Lancar")?.status ||
		monthlySetoran[0]?.status ||
		"—";

	const avgProgress =
		siswaList.length > 0
			? Math.round(
					siswaList.reduce((sum, s) => {
						const recs = setoranList.filter((r) => r.siswaId === s.id);
						return sum + calcProgress(s, recs).pct;
					}, 0) / siswaList.length,
				)
			: 0;

	const statusLabel =
		avgProgress >= 80
			? "Target Terlampaui"
			: avgProgress >= 50
				? "Dalam Jalur"
				: "Perlu Perhatian";

	const statusColor =
		avgProgress >= 80
			? "bg-emerald-400 text-emerald-900"
			: avgProgress >= 50
				? "bg-amber-400 text-amber-900"
				: "bg-red-400 text-red-900";

	function exportCSV() {
		if (filteredSetoran.length === 0) {
			toast.error("Tidak ada data untuk diekspor");
			return;
		}

		const siswaMap = Object.fromEntries(siswaList.map((s) => [s.id, s.nama]));
		let csv = "Tanggal,Nama,Jenis,Surah,Ayat,Status,Catatan\n";
		filteredSetoran.forEach((r) => {
			const surahName =
				SURAH_DATA.find((s) => s.number === r.surah)?.name ?? `#${r.surah}`;
			const cat = (r.catatan || "").replace(/"/g, '""');
			csv += `${r.tanggal},"${siswaMap[r.siswaId] ?? "?"}",${r.type},"${surahName}","${r.ayatAwal}-${r.ayatAkhir}",${r.status},"${cat}"\n`;
		});

		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `Laporan_${now.toISOString().split("T")[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("CSV diekspor!");
	}

	async function exportPDF() {
		setPreviewOpen(true);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-sm text-muted-foreground">Memuat data...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-20 md:pb-6 print:space-y-4 print:pb-0">
			<div className="flex items-center justify-between print:hidden">
				<div>
					<h2 className="text-base font-semibold">
						Laporan — Progres & Insight
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{monthlySetoran.length} setoran bulan ini
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => setView("grid")}
						className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
							view === "grid"
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground"
						}`}
					>
						Grid
					</button>
					<button
						onClick={() => setView("list")}
						className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
							view === "list"
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground"
						}`}
					>
						List
					</button>
					<Button
						variant="outline"
						size="sm"
						onClick={exportCSV}
						className="ml-2"
					>
						Export CSV
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPresensiExportOpen(true)}
						className="ml-2"
					>
						Export Presensi
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={exportPDF}
						className="ml-2 print:hidden"
					>
						Rekap PDF
					</Button>
				</div>
			</div>

			{/* Student Cards */}
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
				{siswaList.map((s) => {
					const recs = setoranList.filter((r) => r.siswaId === s.id);
					const p = calcProgress(s, recs);
					const lastRec = recs.sort((a, b) =>
						b.tanggal.localeCompare(a.tanggal),
					)[0];
					const lastGrade = lastRec?.status || "—";
					const [bg, fg] = getAvatarColors(s.nama);
					const initials = s.nama
						.split(" ")
						.map((w) => w[0])
						.join("")
						.slice(0, 2)
						.toUpperCase();
					return (
						<button
							key={s.id}
							onClick={() => setModalSiswa(s)}
							className="rounded-2xl border bg-card p-4 shadow-xs transition-all hover:shadow-md text-left w-full"
						>
							<div className="flex items-center gap-3">
								<div
									className="flex size-10 items-center justify-center rounded-full text-sm font-bold shrink-0"
									style={{ background: bg, color: fg }}
								>
									{initials}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">{s.nama}</p>
									<p className="text-xs text-muted-foreground">
										{recs.length} setoran
									</p>
								</div>
								<span
									className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold shrink-0 ${
										STATUS_COLORS[lastGrade] ?? "bg-muted text-muted-foreground"
									}`}
								>
									{lastGrade}
								</span>
							</div>
							<div className="mt-3">
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>Progres</span>
									<span>{p.pct}%</span>
								</div>
								<div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-primary transition-all"
										style={{ width: `${Math.min(p.pct, 100)}%` }}
									/>
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{/* Monthly Insight Card */}
			<div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-2xl p-6">
				<div className="flex items-start justify-between">
					<div>
						<h3 className="text-lg font-bold">
							Evaluasi Capaian{halaqahName ? ` ${halaqahName}` : ""}
						</h3>
						<p className="mt-1 text-sm text-teal-200">
							Ringkasan bulan{" "}
							{now.toLocaleDateString("id-ID", {
								month: "long",
								year: "numeric",
							})}
						</p>
					</div>
					<span
						className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor}`}
					>
						{statusLabel}
					</span>
				</div>
				<div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div>
						<p className="text-2xl font-bold">{monthlySetoran.length}</p>
						<p className="text-xs text-teal-200">Setoran Bulan Ini</p>
					</div>
					<div>
						<p className="text-2xl font-bold">{juzCompleted}</p>
						<p className="text-xs text-teal-200">Juz Selesai</p>
					</div>
					<div>
						<p className="text-2xl font-bold">{topGrade}</p>
						<p className="text-xs text-teal-200">Grade Tertinggi</p>
					</div>
					<div>
						<p className="text-2xl font-bold">{avgProgress}%</p>
						<p className="text-xs text-teal-200">Rata-rata Progres</p>
					</div>
				</div>
			</div>

			{/* Filter by Siswa */}
			<div className="flex gap-2 overflow-x-auto pb-2 print:hidden">
				<button
					onClick={() => setSelectedSiswa(null)}
					className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
						!selectedSiswa
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:bg-muted/80"
					}`}
				>
					Semua Siswa
				</button>
				{siswaList.map((s) => (
					<button
						key={s.id}
						onClick={() => setSelectedSiswa(s.id)}
						className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
							selectedSiswa === s.id
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/80"
						}`}
					>
						{s.nama}
					</button>
				))}
			</div>

			{/* Charts Row */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Pie Chart */}
				<div className="rounded-2xl border bg-card p-5 shadow-xs">
					<h3 className="mb-4 text-base font-semibold">Status Bulan Ini</h3>
					{pieData.length > 0 ? (
						<ResponsiveContainer width="100%" height={200}>
							<PieChart>
								<Pie
									data={pieData}
									cx="50%"
									cy="50%"
									innerRadius={50}
									outerRadius={80}
									paddingAngle={4}
									dataKey="value"
								>
									{pieData.map((_, i) => (
										<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					) : (
						<p className="py-8 text-center text-sm text-muted-foreground">
							Belum ada data
						</p>
					)}
					<div className="mt-2 flex justify-center gap-4">
						{pieData.map((d, i) => (
							<div key={d.name} className="flex items-center gap-2">
								<div
									className="size-3 rounded-full"
									style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
								/>
								<span className="text-xs text-muted-foreground">
									{d.name} ({d.value})
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Weekly Trend */}
				<div className="rounded-2xl border bg-card p-5 shadow-xs">
					<h3 className="mb-4 text-base font-semibold">Tren Mingguan</h3>
					{weeklyTrend.length > 0 ? (
						<ResponsiveContainer width="100%" height={200}>
							<BarChart data={weeklyTrend}>
								<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
								<XAxis dataKey="day" className="text-xs" />
								<YAxis className="text-xs" />
								<Tooltip
									contentStyle={{
										borderRadius: "0.75rem",
										border: "1px solid var(--border)",
										background: "var(--card)",
										fontSize: "0.875rem",
									}}
								/>
								<Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					) : (
						<p className="py-8 text-center text-sm text-muted-foreground">
							Belum ada data
						</p>
					)}
				</div>
			</div>

			{/* Setoran List */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs">
				<h3 className="mb-4 text-base font-semibold">
					Riwayat Setoran ({filteredSetoran.length})
				</h3>
				{filteredSetoran.length > 0 ? (
					view === "grid" ? (
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{filteredSetoran
								.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
								.slice(0, 30)
								.map((r) => {
									const siswaName =
										siswaList.find((s) => s.id === r.siswaId)?.nama ?? "?";
									const surahName =
										SURAH_DATA.find((s) => s.number === r.surah)?.name ??
										`#${r.surah}`;
									return (
										<div
											key={r.id}
											className="rounded-xl border p-3 transition-colors hover:bg-muted/30"
										>
											<div className="flex items-start justify-between">
												<div>
													<p className="text-sm font-semibold">{siswaName}</p>
													<p className="text-xs text-muted-foreground">
														{surahName} ({r.ayatAwal}-{r.ayatAkhir})
													</p>
												</div>
												<span
													className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
														STATUS_COLORS[r.status] ?? ""
													}`}
												>
													{r.status}
												</span>
											</div>
											<div className="mt-2 flex items-center justify-between">
												<span className="text-xs font-bold text-primary">
													{r.type}
												</span>
												<span className="text-xs text-muted-foreground">
													{fmtDate(r.tanggal)}
												</span>
											</div>
										</div>
									);
								})}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-xs text-muted-foreground">
										<th className="pb-2 pr-4">Tanggal</th>
										<th className="pb-2 pr-4">Siswa</th>
										<th className="pb-2 pr-4">Jenis</th>
										<th className="pb-2 pr-4">Setoran</th>
										<th className="pb-2">Status</th>
									</tr>
								</thead>
								<tbody>
									{filteredSetoran
										.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
										.slice(0, 50)
										.map((r) => (
											<tr key={r.id} className="border-b border-border/50">
												<td className="py-2 pr-4">{fmtDate(r.tanggal)}</td>
												<td className="py-2 pr-4 font-semibold">
													{siswaList.find((s) => s.id === r.siswaId)?.nama ??
														"?"}
												</td>
												<td className="py-2 pr-4 font-bold text-primary">
													{r.type}
												</td>
												<td className="py-2 pr-4">
													{SURAH_DATA.find((s) => s.number === r.surah)?.name ??
														`#${r.surah}`}{" "}
													({r.ayatAwal}-{r.ayatAkhir})
												</td>
												<td className="py-2">
													<span
														className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
															STATUS_COLORS[r.status] ?? ""
														}`}
													>
														{r.status}
													</span>
												</td>
											</tr>
										))}
								</tbody>
							</table>
						</div>
					)
				) : (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Belum ada riwayat setoran
					</p>
				)}
			</div>

			{/* Student Modal */}
			<StudentModal
				open={!!modalSiswa}
				onOpenChange={(o) => {
					if (!o) setModalSiswa(null);
				}}
				siswa={modalSiswa}
				setoranList={setoranList.filter((r) => r.siswaId === modalSiswa?.id)}
			/>

			{/* PDF Preview */}
			<PdfPreviewDialog
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				payload={{ type: "laporan" }}
				filename={`Laporan_${new Date().toISOString().split("T")[0]}.pdf`}
			/>

			{/* Presensi Export */}
			<PresensiExportDialog
				open={presensiExportOpen}
				onOpenChange={setPresensiExportOpen}
			/>
		</div>
	);
}

function getWeeklyTrend(setoran: Setoran[]) {
	const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
	const now = new Date();
	const weekAgo = new Date(now);
	weekAgo.setDate(weekAgo.getDate() - 6);

	const counts: Record<string, number> = {};
	for (let i = 0; i < 7; i++) {
		const d = new Date(weekAgo);
		d.setDate(d.getDate() + i);
		counts[d.toISOString().split("T")[0]] = 0;
	}

	setoran.forEach((r) => {
		if (r.tanggal in counts) counts[r.tanggal]++;
	});

	return Object.entries(counts).map(([date, count]) => {
		const d = new Date(`${date}T00:00:00`);
		return { day: days[d.getDay()], count };
	});
}

function fmtDate(date: string) {
	return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
	});
}
