import { BookOpen, CalendarCheck } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SURAH_DATA } from "@/lib/surah-data";

interface SiswaData {
	nama: string;
	hafalan: number;
	target: number;
}

interface Setoran {
	id: string;
	type: string;
	tanggal: string;
	surah: number;
	ayatAwal: number;
	ayatAkhir: number;
	status: string;
	catatan?: string;
}

interface Presensi {
	id: string;
	tanggal: string;
	status: string;
}

export const Route = createFileRoute("/parent")({
	component: ParentDashboard,
});

function ParentDashboard() {
	const navigate = useNavigate();
	const [siswa, setSiswa] = useState<SiswaData | null>(null);
	const [setoranList, setSetoranList] = useState<Setoran[]>([]);
	const [presensiList, setPresensiList] = useState<Presensi[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch("/api/parent-data");
				if (!res.ok) {
					navigate({ to: "/login" });
					return;
				}
				const data = await res.json();
				setSiswa(data.siswa);
				setSetoranList(data.setoran);
				setPresensiList(data.presensi);
			} catch {
				navigate({ to: "/login" });
			}
			setLoading(false);
		}
		load();
	}, [navigate]);

	async function handleLogout() {
		await fetch("/api/parent-auth", { method: "DELETE" });
		navigate({ to: "/login" });
	}

	const progressPercent = siswa
		? Math.min(
				100,
				Math.round((siswa.hafalan / Math.max(siswa.target, 1)) * 100),
			)
		: 0;

	const hadirCount = presensiList.filter((p) => p.status === "Hadir").length;
	const totalPresensi = presensiList.length;

	const STATUS_COLORS: Record<string, string> = {
		Lancar: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
		"Mulai Lancar": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
		"Tidak Lancar": "bg-red-500/15 text-red-700 dark:text-red-400",
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-sm text-muted-foreground">Memuat...</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6 p-4 pb-24">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<img
						src="/logo-sijil-v3.svg"
						alt="Sijil"
						className="size-9 rounded-xl"
					/>
					<div>
						<h1 className="text-base font-bold">Sijil Mutaba'ah</h1>
						<p className="text-xs text-muted-foreground">Portal Orang Tua</p>
					</div>
				</div>
				<Button variant="outline" size="sm" onClick={handleLogout}>
					Keluar
				</Button>
			</div>

			{siswa && (
				<>
					{/* Student Card */}
					<div className="rounded-2xl border bg-card p-5 shadow-xs">
						<h2 className="text-lg font-bold">{siswa.nama}</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Hafalan: {siswa.hafalan} / {siswa.target} juz
						</p>
						<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary transition-all"
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
						<p className="mt-1 text-right text-xs text-muted-foreground">
							{progressPercent}%
						</p>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-2xl border bg-card p-4 shadow-xs">
							<div className="flex items-center gap-2 text-muted-foreground">
								<HugeiconsIcon icon={BookOpen} className="size-4" />
								<span className="text-xs font-medium">Setoran</span>
							</div>
							<p className="mt-1 text-2xl font-bold">{setoranList.length}</p>
						</div>
						<div className="rounded-2xl border bg-card p-4 shadow-xs">
							<div className="flex items-center gap-2 text-muted-foreground">
								<HugeiconsIcon icon={CalendarCheck} className="size-4" />
								<span className="text-xs font-medium">Kehadiran</span>
							</div>
							<p className="mt-1 text-2xl font-bold">
								{hadirCount}/{totalPresensi}
							</p>
						</div>
					</div>

					{/* Recent Setoran */}
					<div className="rounded-2xl border bg-card p-5 shadow-xs">
						<h3 className="mb-3 text-sm font-semibold">Riwayat Setoran</h3>
						{setoranList.length > 0 ? (
							<div className="space-y-2">
								{setoranList
									.slice()
									.reverse()
									.slice(0, 10)
									.map((s) => {
										const surah = SURAH_DATA.find((d) => d.number === s.surah);
										return (
											<div
												key={s.id}
												className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2"
											>
												<div>
													<p className="text-sm font-medium">
														{s.type === "ziyadah" ? "Ziyadah" : "Murajaah"} —{" "}
														{surah?.name || `Surah ${s.surah}`}
													</p>
													<p className="text-xs text-muted-foreground">
														Ayat {s.ayatAwal}–{s.ayatAkhir} · {s.tanggal}
													</p>
												</div>
												<span
													className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[s.status] || "bg-muted text-muted-foreground"}`}
												>
													{s.status}
												</span>
											</div>
										);
									})}
							</div>
						) : (
							<p className="py-4 text-center text-sm text-muted-foreground">
								Belum ada setoran
							</p>
						)}
					</div>
				</>
			)}
		</div>
	);
}
