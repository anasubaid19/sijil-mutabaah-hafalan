import {
	BookOpen,
	BookOpen01Icon,
	CalendarCheck,
	Clock,
	Group,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { MushafPanel } from "@/components/mushaf-panel";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { calcProgress, getSurahName } from "@/lib/progress";
import { localDateString } from "@/lib/utils";

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
	surahAkhir?: number | null;
	lintas?: boolean;
	ayatAwal: number;
	ayatAkhir: number;
	status: string;
	isMutqin?: boolean;
}

interface Presensi {
	id: string;
	siswaId: string;
	tanggal: string;
	status: string;
}

const PRESENSI_STATUSES = ["Hadir", "Izin", "Sakit", "Alpha"] as const;
type PresensiStatus = (typeof PRESENSI_STATUSES)[number];

const CHIP_COLORS: Record<PresensiStatus, string> = {
	Hadir:
		"bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30",
	Izin: "bg-blue-500/15 text-blue-700 dark:text-blue-400 ring-blue-500/30",
	Sakit: "bg-amber-500/15 text-amber-800 dark:text-amber-400 ring-amber-500/30",
	Alpha: "bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/30",
};

const CHIP_ACTIVE: Record<PresensiStatus, string> = {
	Hadir: "ring-2 ring-emerald-500 bg-emerald-500/25",
	Izin: "ring-2 ring-blue-500 bg-blue-500/25",
	Sakit: "ring-2 ring-amber-500 bg-amber-500/25",
	Alpha: "ring-2 ring-red-500 bg-red-500/25",
};

const STATUS_COLORS: Record<string, string> = {
	Lancar: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
	"Mulai Lancar": "bg-amber-500/15 text-amber-800 dark:text-amber-400",
	"Tidak Lancar": "bg-red-500/15 text-red-700 dark:text-red-400",
};

export const Route = createFileRoute("/_authed/dashboard")({
	component: DashboardPage,
});

function todayStr() {
	return localDateString();
}

function DashboardPage() {
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [setoranList, setSetoranList] = useState<Setoran[]>([]);
	const [presensiList, setPresensiList] = useState<Presensi[]>([]);
	const [loading, setLoading] = useState(true);
	const [mushafOpen, setMushafOpen] = useState(false);
	const [chartType, setChartType] = useState<"bar" | "line">("bar");
	const [chartRange, setChartRange] = useState<"week" | "month">("week");
	const [resetOpen, setResetOpen] = useState(false);
	const [announce, setAnnounce] = useState("");
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" && window.innerWidth < 768,
	);
	const [reducedMotion, setReducedMotion] = useState(
		() =>
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches,
	);

	const today = todayStr();

	useEffect(() => {
		async function load() {
			try {
				const [sRes, stRes, pRes] = await Promise.all([
					fetch("/api/siswa"),
					fetch("/api/setoran"),
					fetch(`/api/presensi?tanggal=${today}`),
				]);
				if (sRes.ok) setSiswaList(await sRes.json());
				if (stRes.ok) setSetoranList(await stRes.json());
				if (pRes.ok) setPresensiList(await pRes.json());
			} catch {}
			setLoading(false);
		}
		load();
	}, [today]);

	useEffect(() => {
		function onResize() {
			setIsMobile(window.innerWidth < 768);
		}
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => setReducedMotion(media.matches);
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);

	const todayPresensiMap = new Map(presensiList.map((p) => [p.siswaId, p]));

	const hadirCount = presensiList.filter((p) => p.status === "Hadir").length;
	const sudahSetor = new Set(
		setoranList.filter((r) => r.tanggal === today).map((r) => r.siswaId),
	).size;
	const belumSetor = siswaList.length - sudahSetor;

	const weeklyData = getWeeklyData(setoranList);
	const monthlyData = getMonthlyData(setoranList);
	const chartData = chartRange === "week" ? weeklyData : monthlyData;

	const recentSetoran = [...setoranList]
		.sort(
			(a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id),
		)
		.slice(0, 8);

	const attentionNeeded = siswaList.filter((s) => {
		const recent = setoranList
			.filter((r) => r.siswaId === s.id)
			.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
			.slice(0, 3);
		return recent.some((r) => r.status === "Tidak Lancar");
	});

	const handlePresensiChange = useCallback(
		async (siswaId: string, status: PresensiStatus) => {
			const existing = todayPresensiMap.get(siswaId);
			const nama = siswaList.find((s) => s.id === siswaId)?.nama;

			if (existing && existing.status === status) {
				await fetch(`/api/presensi?id=${existing.id}`, { method: "DELETE" });
				setPresensiList((prev) => prev.filter((p) => p.siswaId !== siswaId));
				setAnnounce(`Presensi ${nama} dihapus`);
				return;
			}

			if (existing) {
				const res = await fetch("/api/presensi", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id: existing.id, status }),
				});
				if (res.ok) {
					setPresensiList((prev) =>
						prev.map((p) => (p.siswaId === siswaId ? { ...p, status } : p)),
					);
					setAnnounce(`${nama}: ${status}`);
				}
			} else {
				const res = await fetch("/api/presensi", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ siswaId, tanggal: today, status }),
				});
				if (res.ok) {
					const row = await res.json();
					setPresensiList((prev) => [...prev, row]);
					setAnnounce(`${nama}: ${status}`);
				}
			}
		},
		[today, todayPresensiMap, siswaList],
	);

	const markAllPresent = useCallback(async () => {
		const promises = siswaList
			.filter(
				(s) =>
					!todayPresensiMap.has(s.id) ||
					todayPresensiMap.get(s.id)?.status !== "Hadir",
			)
			.map(async (s) => {
				const existing = todayPresensiMap.get(s.id);
				if (existing) {
					return fetch("/api/presensi", {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ id: existing.id, status: "Hadir" }),
					});
				}
				return fetch("/api/presensi", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						siswaId: s.id,
						tanggal: today,
						status: "Hadir",
					}),
				});
			});
		await Promise.all(promises);
		const pRes = await fetch(`/api/presensi?tanggal=${today}`);
		if (pRes.ok) setPresensiList(await pRes.json());
	}, [siswaList, todayPresensiMap, today]);

	const resetPresensi = useCallback(async () => {
		const promises = presensiList.map((p) =>
			fetch(`/api/presensi?id=${p.id}`, { method: "DELETE" }),
		);
		await Promise.all(promises);
		setPresensiList([]);
	}, [presensiList]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-sm text-muted-foreground">Memuat data...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-20 md:pb-6">
			{/* Quick Actions */}
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setMushafOpen(!mushafOpen)}
				>
					<HugeiconsIcon icon={BookOpen01Icon} className="w-4 h-4 mr-1.5" />
					{mushafOpen ? "Tutup Mushaf" : "Buka Mushaf"}
				</Button>
			</div>

			{/* Mushaf Panel (read-only) */}
			<MushafPanel
				open={mushafOpen}
				onClose={() => setMushafOpen(false)}
				mode="read"
				onSelect={() => {}}
			/>

			{/* Stats Cards */}
			<div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
				<StatCard
					icon={Group}
					label="Kehadiran"
					value={`${hadirCount}/${siswaList.length}`}
					color="text-emerald-600 dark:text-emerald-400"
					sub={`${siswaList.length > 0 ? Math.round((hadirCount / siswaList.length) * 100) : 0}% tingkat kehadiran`}
				/>
				<StatCard
					icon={CalendarCheck}
					label="Hadir Hari Ini"
					value={hadirCount}
					color="text-blue-600 dark:text-blue-400"
					sub={`dari ${siswaList.length} siswa`}
				/>
				<StatCard
					icon={BookOpen}
					label="Sudah Setor"
					value={sudahSetor}
					color="text-primary"
					sub="hari ini"
				/>
				<StatCard
					icon={Clock}
					label="Belum Setor"
					value={belumSetor}
					color="text-amber-600 dark:text-amber-400"
					sub="perlu tindak lanjut"
				/>
			</div>

			{/* Presensi */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-base font-semibold">Presensi Hari Ini</h2>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={markAllPresent}>
							Semua Hadir
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setResetOpen(true)}
						>
							Atur Ulang
						</Button>
					</div>
				</div>
				<div role="status" aria-live="polite" className="sr-only">
					{announce}
				</div>
				{/* Summary bar */}
				<div className="mb-3 flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-2.5">
					<div className="flex-1">
						<div className="h-2 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-emerald-500 transition-all"
								style={{
									width: `${siswaList.length > 0 ? Math.round((hadirCount / siswaList.length) * 100) : 0}%`,
								}}
							/>
						</div>
					</div>
					<span className="shrink-0 text-xs font-semibold text-muted-foreground">
						{hadirCount}/{siswaList.length} Hadir
					</span>
				</div>
				<div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
					<span className="inline-flex items-center gap-1">
						<span className="inline-block size-2 rounded-sm bg-emerald-500" />H
						= Hadir
					</span>
					<span className="inline-flex items-center gap-1">
						<span className="inline-block size-2 rounded-sm bg-blue-500" />I =
						Izin
					</span>
					<span className="inline-flex items-center gap-1">
						<span className="inline-block size-2 rounded-sm bg-amber-500" />S =
						Sakit
					</span>
					<span className="inline-flex items-center gap-1">
						<span className="inline-block size-2 rounded-sm bg-red-500" />A =
						Alpha
					</span>
				</div>
				{siswaList.length > 0 ? (
					<>
						<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
							{siswaList.slice(0, 8).map((s) => {
								const current = todayPresensiMap.get(s.id)?.status;
								return (
									<div
										key={s.id}
										className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2"
									>
										<span className="text-sm font-medium truncate">
											{s.nama}
										</span>
										<div className="flex gap-1">
											{PRESENSI_STATUSES.map((st) => (
												<button
													type="button"
													key={st}
													onClick={() => handlePresensiChange(s.id, st)}
													aria-label={`Tandai ${s.nama}: ${st}`}
													aria-pressed={current === st}
													className={`rounded-md px-2 py-1.5 text-xs font-semibold min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring ${
														current === st ? CHIP_ACTIVE[st] : CHIP_COLORS[st]
													}`}
												>
													{st[0]}
												</button>
											))}
										</div>
									</div>
								);
							})}
						</div>
						{siswaList.length > 8 && (
							<Link
								to="/presensi"
								className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-muted/50 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
							>
								Lihat Semua Presensi ({siswaList.length} siswa)
							</Link>
						)}
					</>
				) : (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Belum ada siswa.{" "}
						<Link
							to="/pengaturan"
							className="font-medium text-primary hover:underline"
						>
							Tambah siswa
						</Link>
					</p>
				)}
			</div>

			{/* Weekly/Monthly: Bar / Line */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs">
				{isMobile ? (
					/* Mobile: vertical stack */
					<div className="space-y-3">
						<div>
							<h2 className="text-base font-semibold">
								Setoran {chartRange === "week" ? "Minggu" : "Bulan"} Ini
							</h2>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Statistik setoran{" "}
								{chartRange === "week" ? "7 hari terakhir" : "bulan ini"}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
								{(
									[
										["week", "Minggu"],
										["month", "Bulan"],
									] as const
								).map(([key, label]) => (
									<button
										key={key}
										type="button"
										onClick={() => setChartRange(key)}
										aria-pressed={chartRange === key}
										className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
											chartRange === key
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										{label}
									</button>
								))}
							</div>
							<div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
								{(
									[
										["bar", "Batang"],
										["line", "Garis"],
									] as const
								).map(([key, label]) => (
									<button
										key={key}
										type="button"
										onClick={() => setChartType(key)}
										aria-pressed={chartType === key}
										className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
											chartType === key
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										{label}
									</button>
								))}
							</div>
						</div>
						{/* Legend — compact pills */}
						<div className="flex items-center justify-center gap-4 text-xs font-medium">
							<span className="inline-flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-[var(--chart-1)]" />
								Ziyadah
							</span>
							<span className="inline-flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-[var(--chart-2)]" />
								Murajaah
							</span>
						</div>
						{chartData.length > 0 ? (
							<ChartBlock
								chartType={chartType}
								chartData={chartData}
								height={220}
								reducedMotion={reducedMotion}
							/>
						) : (
							<div className="flex flex-col items-center gap-2 py-10">
								<HugeiconsIcon
									icon={BookOpen}
									className="size-8 text-muted-foreground/30"
									strokeWidth={1.5}
								/>
								<p className="text-sm text-muted-foreground">
									Belum ada setoran {chartRange === "week" ? "minggu" : "bulan"}{" "}
									ini
								</p>
								<p className="text-xs text-muted-foreground/60">
									Mulai input Ziyadah atau Murajaah agar statistik dapat
									ditampilkan
								</p>
							</div>
						)}
					</div>
				) : (
					/* Desktop: unchanged layout */
					<>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-base font-semibold">
								Setoran {chartRange === "week" ? "Minggu" : "Bulan"} Ini
							</h2>
							<div className="flex items-center gap-2">
								<div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
									{(
										[
											["week", "Minggu"],
											["month", "Bulan"],
										] as const
									).map(([key, label]) => (
										<button
											key={key}
											type="button"
											onClick={() => setChartRange(key)}
											aria-pressed={chartRange === key}
											className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
												chartRange === key
													? "bg-background text-foreground shadow-sm"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{label}
										</button>
									))}
								</div>
								<div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
									{(
										[
											["bar", "Batang"],
											["line", "Garis"],
										] as const
									).map(([key, label]) => (
										<button
											key={key}
											type="button"
											onClick={() => setChartType(key)}
											aria-pressed={chartType === key}
											className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
												chartType === key
													? "bg-background text-foreground shadow-sm"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{label}
										</button>
									))}
								</div>
							</div>
						</div>
						{chartData.length > 0 ? (
							<ChartBlock
								chartType={chartType}
								chartData={chartData}
								height={200}
								reducedMotion={reducedMotion}
							/>
						) : (
							<p className="py-8 text-center text-sm text-muted-foreground">
								Belum ada setoran {chartRange === "week" ? "minggu" : "bulan"}{" "}
								ini
							</p>
						)}
					</>
				)}
			</div>

			{/* Recent Activity */}
			{recentSetoran.length > 0 && (
				<div className="rounded-2xl border bg-card p-5 shadow-xs">
					<h2 className="mb-4 text-base font-semibold">Aktivitas Terakhir</h2>
					<div className="space-y-2">
						{recentSetoran.map((r) => {
							const siswa = siswaList.find((s) => s.id === r.siswaId);
							return (
								<div
									key={r.id}
									className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5 transition-colors duration-200 hover:bg-muted"
								>
									<div className="min-w-0">
										<p className="text-sm font-medium truncate">
											{siswa?.nama ?? "—"}
										</p>
										<p className="text-xs text-muted-foreground">
											{r.type} —{" "}
											{r.lintas && r.surahAkhir
												? `${getSurahName(r.surah)} → ${getSurahName(r.surahAkhir)} (${r.ayatAwal}–${r.ayatAkhir})`
												: `${getSurahName(r.surah)} ${r.ayatAwal}:${r.ayatAkhir}`}
										</p>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span
											className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
												STATUS_COLORS[r.status] ?? ""
											}`}
										>
											{r.status}
										</span>
										<span className="text-xs text-muted-foreground">
											{fmtDate(r.tanggal)}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Attention Needed */}
			{attentionNeeded.length > 0 && (
				<div className="rounded-2xl border bg-card p-5 shadow-xs">
					<h2 className="mb-4 text-base font-semibold">Perlu Perhatian</h2>
					<div className="space-y-3">
						{attentionNeeded.map((s) => {
							const recent = setoranList
								.filter((r) => r.siswaId === s.id)
								.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
								.slice(0, 1);
							const last = recent[0];
							const prog = calcProgress(
								s,
								setoranList.filter((r) => r.siswaId === s.id),
							);
							return (
								<div
									key={s.id}
									className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3 transition-colors duration-200 hover:bg-muted"
								>
									<div>
										<p className="text-sm font-semibold">{s.nama}</p>
										<p className="text-xs text-muted-foreground">
											{last?.status} — {fmtDate(last?.tanggal)}
											{!prog.noTarget && ` • ${prog.pct}%`}
										</p>
									</div>
									<span
										className={`rounded-full px-3 py-1 text-xs font-semibold ${
											STATUS_COLORS[last?.status ?? ""] ?? ""
										}`}
									>
										{last?.status}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Siswa Progress */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs">
				<h2 className="mb-4 text-base font-semibold">Progres Siswa</h2>
				{siswaList.length > 0 ? (
					<>
						<div className="space-y-3">
							{siswaList
								.map((s) => {
									const prog = calcProgress(
										s,
										setoranList.filter((r) => r.siswaId === s.id),
									);
									return { siswa: s, ...prog };
								})
								.sort((a, b) => b.pct - a.pct)
								.slice(0, 5)
								.map((item, i) => (
									<div key={item.siswa.id} className="space-y-1.5">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
													{i + 1}
												</span>
												<span className="text-sm font-semibold">
													{item.siswa.nama}
												</span>
											</div>
											<span className="text-xs text-muted-foreground">
												{item.noTarget
													? "Belum ada target"
													: `${item.current}/${item.target} ${item.unit.toLowerCase()} (${item.pct}%)`}
											</span>
										</div>
										{!item.noTarget && (
											<div className="h-2 overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full bg-primary transition-all"
													style={{ width: `${item.pct}%` }}
												/>
											</div>
										)}
									</div>
								))}
						</div>
						{siswaList.length > 5 && (
							<Link
								to="/laporan"
								className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-muted/50 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
							>
								Lihat Semua Siswa ({siswaList.length})
							</Link>
						)}
					</>
				) : (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Belum ada siswa.{" "}
						<Link
							to="/pengaturan"
							className="font-medium text-primary hover:underline"
						>
							Tambah siswa
						</Link>
					</p>
				)}
			</div>

			{/* Reset confirmation */}
			<AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus semua presensi hari ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Status kehadiran {fmtDate(today)} untuk semua siswa akan dihapus
							dan tidak dapat dipulihkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setResetOpen(false)}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								setResetOpen(false);
								resetPresensi();
							}}
						>
							Hapus presensi
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function ChartBlock({
	chartType,
	chartData,
	height,
	reducedMotion,
}: {
	chartType: "bar" | "line";
	chartData: { day: string; ziyadah: number; murajaah: number }[];
	height: number;
	reducedMotion: boolean;
}) {
	if (chartType === "bar") {
		return (
			<ResponsiveContainer width="100%" height={height}>
				<BarChart data={chartData}>
					<CartesianGrid
						strokeDasharray="3 3"
						className="[stroke:var(--border)]"
						strokeOpacity={0.15}
					/>
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
					<Bar
						dataKey="ziyadah"
						name="Ziyadah"
						fill="var(--chart-1)"
						radius={[4, 4, 0, 0]}
						isAnimationActive={!reducedMotion}
						animationDuration={200}
						animationEasing="cubic-bezier(0.23,1,0.32,1)"
					/>
					<Bar
						dataKey="murajaah"
						name="Murajaah"
						fill="var(--chart-2)"
						radius={[4, 4, 0, 0]}
						isAnimationActive={!reducedMotion}
						animationDuration={200}
						animationEasing="cubic-bezier(0.23,1,0.32,1)"
					/>
				</BarChart>
			</ResponsiveContainer>
		);
	}
	return (
		<ResponsiveContainer width="100%" height={height}>
			<LineChart data={chartData}>
				<CartesianGrid
					strokeDasharray="3 3"
					className="[stroke:var(--border)]"
					strokeOpacity={0.15}
				/>
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
				<Line
					type="monotone"
					dataKey="ziyadah"
					name="Ziyadah"
					stroke="var(--chart-1)"
					strokeWidth={2}
					dot={{ fill: "var(--chart-1)", r: 4 }}
					isAnimationActive={!reducedMotion}
					animationDuration={200}
					animationEasing="cubic-bezier(0.23,1,0.32,1)"
				/>
				<Line
					type="monotone"
					dataKey="murajaah"
					name="Murajaah"
					stroke="var(--chart-2)"
					strokeWidth={2}
					dot={{ fill: "var(--chart-2)", r: 4 }}
					isAnimationActive={!reducedMotion}
					animationDuration={200}
					animationEasing="cubic-bezier(0.23,1,0.32,1)"
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}

function StatCard({
	icon,
	label,
	value,
	color,
	sub,
}: {
	icon: React.ComponentType<{ strokeWidth: number }>;
	label: string;
	value: number | string;
	color: string;
	sub?: string;
}) {
	return (
		<div className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-sm">
			<div
				className={`flex size-10 items-center justify-center rounded-xl bg-muted ${color}`}
			>
				<HugeiconsIcon icon={icon} strokeWidth={1.8} />
			</div>
			<div>
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className="text-2xl font-bold tracking-tight">{value}</p>
				{sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
			</div>
		</div>
	);
}

function getWeeklyData(setoran: Setoran[]) {
	const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
	const now = new Date();
	const weekAgo = new Date(now);
	weekAgo.setDate(weekAgo.getDate() - 6);

	const data: Record<string, { ziyadah: number; murajaah: number }> = {};
	for (let i = 0; i < 7; i++) {
		const d = new Date(weekAgo);
		d.setDate(d.getDate() + i);
		const key = localDateString(d);
		data[key] = { ziyadah: 0, murajaah: 0 };
	}

	setoran.forEach((r) => {
		if (r.tanggal in data) {
			if (r.type === "Ziyadah") {
				data[r.tanggal].ziyadah++;
			} else {
				data[r.tanggal].murajaah++;
			}
		}
	});

	return Object.entries(data).map(([date, counts]) => {
		const d = new Date(`${date}T00:00:00`);
		return {
			day: days[d.getDay()],
			tanggal: d.toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
			}),
			...counts,
		};
	});
}

function getMonthlyData(setoran: Setoran[]) {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const data: Record<string, { ziyadah: number; murajaah: number }> = {};
	for (let i = 1; i <= daysInMonth; i++) {
		const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
		data[key] = { ziyadah: 0, murajaah: 0 };
	}

	setoran.forEach((r) => {
		if (r.tanggal in data) {
			if (r.type === "Ziyadah") data[r.tanggal].ziyadah++;
			else data[r.tanggal].murajaah++;
		}
	});

	return Object.entries(data).map(([date, counts]) => {
		const dayNum = Number.parseInt(date.split("-")[2] ?? "1", 10);
		return {
			day: String(dayNum),
			tanggal: new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
			}),
			...counts,
		};
	});
}

function fmtDate(date?: string) {
	if (!date) return "";
	return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}
