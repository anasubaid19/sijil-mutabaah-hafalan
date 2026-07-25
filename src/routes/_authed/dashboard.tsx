import {
	Analytics,
	BookOpen,
	BookOpen01Icon,
	CalendarCheck,
	Group,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { MushafPanel } from "@/components/mushaf-panel";
import { Button } from "@/components/ui/button";

interface Siswa {
	id: string;
	nama: string;
	hafalan: number;
	target: number;
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
}

const STATUS_COLORS: Record<string, string> = {
	Lancar: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
	"Mulai Lancar": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
	"Tidak Lancar": "bg-red-500/15 text-red-700 dark:text-red-400",
};

export const Route = createFileRoute("/_authed/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [setoranList, setSetoranList] = useState<Setoran[]>([]);
	const [loading, setLoading] = useState(true);
	const [mushafOpen, setMushafOpen] = useState(false);

	useEffect(() => {
		async function load() {
			try {
				const [sRes, stRes] = await Promise.all([
					fetch("/api/siswa"),
					fetch("/api/setoran"),
				]);
				if (sRes.ok) setSiswaList(await sRes.json());
				if (stRes.ok) setSetoranList(await stRes.json());
			} catch {}
			setLoading(false);
		}
		load();
	}, []);

	const totalHafalan = siswaList.reduce((acc, s) => acc + s.hafalan, 0);
	const totalSiswa = siswaList.length;
	const ziyadahCount = setoranList.filter((r) => r.type === "Ziyadah").length;
	const murajaahCount = setoranList.filter((r) =>
		r.type.startsWith("Murajaah"),
	).length;

	const weeklyData = getWeeklyData(setoranList);

	const attentionNeeded = siswaList.filter((s) => {
		const recent = setoranList
			.filter((r) => r.siswaId === s.id)
			.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
			.slice(0, 3);
		return recent.some((r) => r.status === "Tidak Lancar");
	});

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
					icon={BookOpen}
					label="Total Hafalan"
					value={totalHafalan}
					color="text-primary"
				/>
				<StatCard
					icon={Group}
					label="Total Siswa"
					value={totalSiswa}
					color="text-blue-600 dark:text-blue-400"
				/>
				<StatCard
					icon={CalendarCheck}
					label="Ziyadah"
					value={ziyadahCount}
					color="text-amber-600 dark:text-amber-400"
				/>
				<StatCard
					icon={Analytics}
					label="Murajaah"
					value={murajaahCount}
					color="text-emerald-600 dark:text-emerald-400"
				/>
			</div>

			{/* Weekly Chart */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs">
				<h2 className="mb-4 text-base font-semibold">Setoran Minggu Ini</h2>
				{weeklyData.length > 0 ? (
					<ResponsiveContainer width="100%" height={240}>
						<BarChart data={weeklyData}>
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
						Belum ada data minggu ini
					</p>
				)}
			</div>

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
							return (
								<div
									key={s.id}
									className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"
								>
									<div>
										<p className="text-sm font-semibold">{s.nama}</p>
										<p className="text-xs text-muted-foreground">
											{last?.status} — {fmtDate(last?.tanggal)}
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
							const pct =
								s.target > 0 ? Math.round((s.hafalan / s.target) * 100) : 0;
							return (
								<div key={s.id} className="space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold">{s.nama}</span>
										<span className="text-xs text-muted-foreground">
											{s.hafalan}/{s.target} juz ({pct}%)
										</span>
									</div>
									<div className="h-2 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary transition-all"
											style={{ width: `${Math.min(pct, 100)}%` }}
										/>
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
	value: number;
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

	const counts: Record<string, number> = {};
	for (let i = 0; i < 7; i++) {
		const d = new Date(weekAgo);
		d.setDate(d.getDate() + i);
		const key = d.toISOString().split("T")[0];
		counts[key] = 0;
	}

	setoran.forEach((r) => {
		if (r.tanggal in counts) {
			counts[r.tanggal]++;
		}
	});

	return Object.entries(counts).map(([date, count]) => {
		const d = new Date(`${date}T00:00:00`);
		return { day: days[d.getDay()], count };
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
