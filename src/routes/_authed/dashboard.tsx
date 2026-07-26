import {
	BookOpen,
	BookOpen01Icon,
	CalendarCheck,
	Clock,
	Group,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { MushafPanel } from "@/components/mushaf-panel";
import { Button } from "@/components/ui/button";
import { calcProgress, getSurahName } from "@/lib/progress";

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
	Sakit: "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/30",
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
	"Mulai Lancar": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
	"Tidak Lancar": "bg-red-500/15 text-red-700 dark:text-red-400",
};

export const Route = createFileRoute("/_authed/dashboard")({
	component: DashboardPage,
});

function todayStr() {
	return new Date().toISOString().split("T")[0];
}

function DashboardPage() {
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [setoranList, setSetoranList] = useState<Setoran[]>([]);
	const [presensiList, setPresensiList] = useState<Presensi[]>([]);
	const [loading, setLoading] = useState(true);
	const [mushafOpen, setMushafOpen] = useState(false);
	const [chartType, setChartType] = useState<"heatmap" | "bar" | "line">(
		"heatmap",
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

	const todayPresensiMap = new Map(presensiList.map((p) => [p.siswaId, p]));

	const hadirCount = presensiList.filter((p) => p.status === "Hadir").length;
	const sudahSetor = new Set(
		setoranList.filter((r) => r.tanggal === today).map((r) => r.siswaId),
	).size;
	const belumSetor = siswaList.length - sudahSetor;

	const weeklyData = getWeeklyData(setoranList);

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

			if (existing && existing.status === status) {
				await fetch(`/api/presensi?id=${existing.id}`, { method: "DELETE" });
				setPresensiList((prev) => prev.filter((p) => p.siswaId !== siswaId));
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
				}
			}
		},
		[today, todayPresensiMap],
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
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					icon={Group}
					label="Kehadiran"
					value={`${hadirCount}/${siswaList.length}`}
					color="text-emerald-600 dark:text-emerald-400"
				/>
				<StatCard
					icon={CalendarCheck}
					label="Hadir Hari Ini"
					value={hadirCount}
					color="text-blue-600 dark:text-blue-400"
				/>
				<StatCard
					icon={BookOpen}
					label="Sudah Setor"
					value={sudahSetor}
					color="text-primary"
				/>
				<StatCard
					icon={Clock}
					label="Belum Setor"
					value={belumSetor}
					color="text-amber-600 dark:text-amber-400"
				/>
			</div>

			{/* Presensi */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold">Presensi Hari Ini</h2>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={markAllPresent}>
							Semua Hadir
						</Button>
						<Button variant="outline" size="sm" onClick={resetPresensi}>
							Reset
						</Button>
					</div>
				</div>
				<div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
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
					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{siswaList.map((s) => {
							const current = todayPresensiMap.get(s.id)?.status;
							return (
								<div
									key={s.id}
									className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2"
								>
									<span className="text-sm font-medium truncate">{s.nama}</span>
									<div className="flex gap-1">
										{PRESENSI_STATUSES.map((st) => (
											<button
												type="button"
												key={st}
												onClick={() => handlePresensiChange(s.id, st)}
												className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
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
				) : (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Belum ada siswa.{" "}
						<a
							href="/pengaturan"
							className="font-medium text-primary hover:underline"
						>
							Tambah siswa
						</a>
					</p>
				)}
			</div>

			{/* Weekly: Heatmap / Bar / Line */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold">Setoran Minggu Ini</h2>
					<div className="flex rounded-lg border bg-muted/50 p-0.5">
						{(
							[
								["heatmap", "Heatmap"],
								["bar", "Bar"],
								["line", "Line"],
							] as const
						).map(([key, label]) => (
							<button
								key={key}
								type="button"
								onClick={() => setChartType(key)}
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

				{weeklyData.length > 0 ? (
					<>
						{chartType === "heatmap" && <HeatmapView data={weeklyData} />}
						{chartType === "bar" && (
							<ResponsiveContainer width="100%" height={240}>
								<BarChart data={weeklyData}>
									<CartesianGrid
										strokeDasharray="3 3"
										className="[stroke:var(--border)]"
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
									<Legend />
									<Bar
										dataKey="ziyadah"
										name="Ziyadah"
										fill="#2563eb"
										radius={[4, 4, 0, 0]}
									/>
									<Bar
										dataKey="murajaah"
										name="Murajaah"
										fill="#f59e0b"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						)}
						{chartType === "line" && (
							<ResponsiveContainer width="100%" height={240}>
								<LineChart data={weeklyData}>
									<CartesianGrid
										strokeDasharray="3 3"
										className="[stroke:var(--border)]"
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
									<Legend />
									<Line
										type="monotone"
										dataKey="ziyadah"
										name="Ziyadah"
										stroke="#2563eb"
										strokeWidth={2}
										dot={{ fill: "#2563eb", r: 4 }}
									/>
									<Line
										type="monotone"
										dataKey="murajaah"
										name="Murajaah"
										stroke="#f59e0b"
										strokeWidth={2}
										dot={{ fill: "#f59e0b", r: 4 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						)}
					</>
				) : (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Belum ada data minggu ini
					</p>
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
									className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5"
								>
									<div className="min-w-0">
										<p className="text-sm font-medium truncate">
											{siswa?.nama ?? "—"}
										</p>
										<p className="text-xs text-muted-foreground">
											{r.type} — {getSurahName(r.surah)} {r.ayatAwal}:
											{r.ayatAkhir}
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
									className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"
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
					<div className="space-y-3">
						{siswaList.map((s) => {
							const prog = calcProgress(
								s,
								setoranList.filter((r) => r.siswaId === s.id),
							);
							return (
								<div key={s.id} className="space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold">{s.nama}</span>
										<span className="text-xs text-muted-foreground">
											{prog.noTarget
												? "Belum ada target"
												: `${prog.current}/${prog.target} ${prog.unit.toLowerCase()} (${prog.pct}%)`}
										</span>
									</div>
									{!prog.noTarget && (
										<div className="h-2 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-primary transition-all"
												style={{ width: `${prog.pct}%` }}
											/>
										</div>
									)}
								</div>
							);
						})}
					</div>
				) : (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Belum ada siswa.{" "}
						<a
							href="/pengaturan"
							className="font-medium text-primary hover:underline"
						>
							Tambah siswa
						</a>
					</p>
				)}
			</div>
		</div>
	);
}

function StatCard({
	icon,
	label,
	value,
	color,
}: {
	icon: React.ComponentType<{ strokeWidth: number }>;
	label: string;
	value: number | string;
	color: string;
}) {
	return (
		<div className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-xs">
			<div
				className={`flex size-10 items-center justify-center rounded-xl bg-muted ${color}`}
			>
				<HugeiconsIcon icon={icon} strokeWidth={1.8} />
			</div>
			<div>
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className="text-2xl font-bold tracking-tight">{value}</p>
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
		const key = d.toISOString().split("T")[0];
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

function fmtDate(date?: string) {
	if (!date) return "";
	return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

const ZIYADAH_HEAT = [
	"oklch(0.97 0 0 / 0.4)",
	"oklch(0.6 0.2 255 / 0.25)",
	"oklch(0.6 0.2 255 / 0.45)",
	"oklch(0.6 0.2 255 / 0.7)",
	"oklch(0.6 0.2 255 / 0.88)",
	"oklch(0.55 0.22 255)",
];

const MURAJAAH_HEAT = [
	"oklch(0.97 0 0 / 0.4)",
	"oklch(0.7 0.17 65 / 0.25)",
	"oklch(0.7 0.17 65 / 0.45)",
	"oklch(0.7 0.17 65 / 0.7)",
	"oklch(0.7 0.17 65 / 0.88)",
	"oklch(0.65 0.18 62)",
];

const HEAT_LEGEND: [string, number][] = [
	["bg-muted/30", 0],
	["bg-stone-400/60", 1],
	["bg-stone-500/70", 2],
	["bg-stone-500", 3],
	["bg-stone-600", 4],
	["bg-stone-700", 5],
];

function heatZiyadah(count: number): string {
	const i = Math.min(count, 5);
	return ZIYADAH_HEAT[i] ?? "oklch(0.97 0 0 / 0.4)";
}

function heatMurajaah(count: number): string {
	const i = Math.min(count, 5);
	return MURAJAAH_HEAT[i] ?? "oklch(0.97 0 0 / 0.4)";
}

interface WeeklyDay {
	day: string;
	tanggal?: string;
	ziyadah: number;
	murajaah: number;
}

function HeatmapView({ data }: { data: WeeklyDay[] }) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
					Ziyadah
				</span>
				<div className="grid flex-1 grid-cols-7 gap-1.5">
					{data.map((d) => (
						<div
							key={`z-${d.day}`}
							className="aspect-square rounded-md"
							style={{ backgroundColor: heatZiyadah(d.ziyadah) }}
							title={`${d.tanggal ?? d.day}: ${d.ziyadah} ziyadah`}
						/>
					))}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
					Murajaah
				</span>
				<div className="grid flex-1 grid-cols-7 gap-1.5">
					{data.map((d) => (
						<div
							key={`m-${d.day}`}
							className="aspect-square rounded-md"
							style={{ backgroundColor: heatMurajaah(d.murajaah) }}
							title={`${d.tanggal ?? d.day}: ${d.murajaah} murajaah`}
						/>
					))}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<span className="w-20 shrink-0" />
				<div className="grid flex-1 grid-cols-7 gap-1.5">
					{data.map((d) => (
						<div
							key={`label-${d.day}`}
							className="text-center text-[0.65rem] text-muted-foreground"
						>
							{d.day}
						</div>
					))}
				</div>
			</div>
			<div className="flex items-center gap-2 pt-1 text-[0.65rem] text-muted-foreground">
				<span>0</span>
				<div className="flex gap-0.5">
					{HEAT_LEGEND.filter(([, c]) => c > 0).map(([cls]) => (
						<div key={cls} className={`size-2.5 rounded-sm ${cls}`} />
					))}
				</div>
				<span>5+</span>
			</div>
		</div>
	);
}
