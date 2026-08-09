import {
	BookOpen,
	CalendarCheck,
	History,
	Repeat,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { calcProgress } from "@/lib/progress";
import { SURAH_DATA } from "@/lib/surah-data";

interface SiswaData {
	nama: string;
	hafalan: number;
	target: number;
	mulaiHafalan?: string;
	metodeProgress?: string;
}

interface MusyrifData {
	nama: string;
	halaqahName: string | null;
}

interface Setoran {
	id: string;
	type: string;
	tanggal: string;
	surah: number;
	surahAkhir?: number;
	lintas?: boolean;
	ayatAwal: number;
	ayatAkhir: number;
	status: string;
	catatan?: string;
	juz?: string | null;
}

interface Presensi {
	id: string;
	tanggal: string;
	status: string;
}

const GRADES = ["Jayyid", "Jayyid Jiddan", "Mumtaz", "Mutqin"] as const;

// ponytail: covers both vocabularies (grade + Lancar) since data can hold either
const STATUS_COLORS: Record<string, string> = {
	Jayyid: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
	"Jayyid Jiddan":
		"bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
	Mumtaz:
		"bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
	Mutqin: "bg-primary/15 text-primary border-primary/30",
	Lancar:
		"bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
	"Mulai Lancar":
		"bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30",
	"Tidak Lancar":
		"bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

export const Route = createFileRoute("/parent")({
	component: ParentDashboard,
});

function ParentDashboard() {
	const navigate = useNavigate();
	const [siswa, setSiswa] = useState<SiswaData | null>(null);
	const [musyrif, setMusyrif] = useState<MusyrifData | null>(null);
	const [setoranList, setSetoranList] = useState<Setoran[]>([]);
	const [presensiList, setPresensiList] = useState<Presensi[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAllHistory, setShowAllHistory] = useState(false);

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
				setMusyrif(data.musyrif ?? null);
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

	const prog = siswa ? calcProgress(siswa, setoranList) : null;
	const progressPercent = prog ? prog.pct : 0;

	const hadirCount = presensiList.filter((p) => p.status === "Hadir").length;
	const totalPresensi = presensiList.length;

	const recent = setoranList.slice().reverse();
	const lastSetoran = recent[0];
	const lastGrade =
		lastSetoran && (GRADES as readonly string[]).includes(lastSetoran.status)
			? lastSetoran.status
			: null;

	const lastUpdated =
		[
			...setoranList.map((s) => s.tanggal),
			...presensiList.map((p) => p.tanggal),
		]
			.sort()
			.at(-1) ?? null;

	function surahName(s: Setoran): string {
		const start = SURAH_DATA.find((d) => d.number === s.surah);
		if (s.surahAkhir && s.surahAkhir !== s.surah) {
			const end = SURAH_DATA.find((d) => d.number === s.surahAkhir);
			return `${start?.name || `Surah ${s.surah}`} – ${end?.name || `Surah ${s.surahAkhir}`}`;
		}
		return start?.name || `Surah ${s.surah}`;
	}

	function typeLabel(type: string): string {
		return type === "Ziyadah" ? "Ziyadah" : "Murajaah";
	}

	const heroSubtitle = [
		"Orang Tua/Wali",
		musyrif?.halaqahName || null,
		musyrif ? musyrif.nama : null,
	]
		.filter(Boolean)
		.join(" · ");

	const cardClass =
		"rounded-2xl border bg-card shadow-xs transition duration-fast hover:shadow-md";

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-muted dark:bg-background">
				<div className="text-sm text-muted-foreground">Memuat...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-muted dark:bg-background">
			<div className="mx-auto w-full max-w-[1200px] px-4 pb-10 sm:px-6 lg:px-8">
				<div className="animate-in fade-in duration-500">
					{/* Header */}
					<header className="flex items-center justify-between gap-3 pt-6">
						<div className="flex items-center gap-3">
							<img
								src="/logo-sijil-v3.svg"
								alt="Sijil"
								className="size-9 rounded-xl"
							/>
							<div>
								<h1 className="text-base font-bold">Sijil Mutaba'ah</h1>
								<p className="text-xs text-muted-foreground">
									Portal Orang Tua
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleLogout}
							className="min-h-9"
						>
							Keluar
						</Button>
					</header>

					{siswa ? (
						<main className="mt-6 space-y-6">
							{/* Hero */}
							<div className="space-y-0.5">
								<p className="text-sm font-medium text-muted-foreground">
									Assalamu'alaikum,
								</p>
								<p className="text-sm text-muted-foreground">{heroSubtitle}</p>
							</div>

							{/* Progress Card */}
							<div className={`${cardClass} p-5`}>
								<p className="text-xs font-medium text-muted-foreground">
									Perkembangan Hafalan
								</p>
								<div className="mt-1 flex items-center justify-between gap-3">
									<h2 className="text-2xl font-bold tracking-tight">
										{siswa.nama}
									</h2>
									<p className="text-3xl font-bold">{progressPercent}%</p>
								</div>
								<p className="mt-1 text-lg font-bold">
									Hafalan {prog?.current ?? 0} / {prog?.target ?? 0}{" "}
									{prog ? prog.unit.toLowerCase() : "juz"}
								</p>
								<div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-primary transition-all"
										style={{ width: `${progressPercent}%` }}
									/>
								</div>
								<p className="mt-2.5 text-xs text-muted-foreground">
									{lastUpdated
										? `Terakhir diperbarui ${formatDate(lastUpdated)}`
										: "Belum ada hafalan yang tercatat."}
								</p>
							</div>

							{/* Hafalan Terakhir */}
							<div className={`${cardClass} p-5`}>
								<h3 className="text-sm font-semibold">Hafalan Terakhir</h3>
								{lastSetoran ? (
									<div className="mt-3 flex items-center justify-between gap-3">
										<div className="flex items-center gap-3">
											<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
												<HugeiconsIcon
													icon={
														lastSetoran.type === "Ziyadah" ? BookOpen : Repeat
													}
													className="size-5"
												/>
											</div>
											<div>
												<p className="text-sm font-medium">
													{typeLabel(lastSetoran.type)} —{" "}
													{surahName(lastSetoran)}
												</p>
												<p className="text-xs text-muted-foreground">
													Ayat {lastSetoran.ayatAwal}–{lastSetoran.ayatAkhir} ·{" "}
													{formatDate(lastSetoran.tanggal)}
												</p>
											</div>
										</div>
										<span
											className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
												STATUS_COLORS[lastSetoran.status] ||
												"bg-muted text-muted-foreground"
											}`}
										>
											{lastSetoran.status}
										</span>
									</div>
								) : (
									<div className="flex flex-col items-center gap-2.5 py-10 text-center">
										<div className="flex size-16 items-center justify-center rounded-full bg-muted">
											<HugeiconsIcon
												icon={BookOpen}
												className="size-7 text-muted-foreground"
											/>
										</div>
										<p className="text-sm font-medium">
											Belum ada hafalan yang tercatat.
										</p>
										<p className="text-xs text-muted-foreground/80">
											Setoran terbaru akan tampil di sini setelah musyrif
											mencatat.
										</p>
									</div>
								)}
							</div>

							{/* Stats */}
							<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
								<div className={`${cardClass} p-5`}>
									<div className="flex items-center gap-2 text-muted-foreground">
										<HugeiconsIcon icon={BookOpen} className="size-5" />
										<span className="text-xs font-medium">Total Setoran</span>
									</div>
									<p
										className={`mt-2 ${
											setoranList.length > 0
												? "text-2xl font-bold"
												: "text-sm text-muted-foreground"
										}`}
									>
										{setoranList.length > 0
											? setoranList.length
											: "Belum ada setoran"}
									</p>
								</div>
								<div className={`${cardClass} p-5`}>
									<div className="flex items-center gap-2 text-muted-foreground">
										<HugeiconsIcon icon={CalendarCheck} className="size-5" />
										<span className="text-xs font-medium">Kehadiran</span>
									</div>
									<p
										className={`mt-2 ${
											totalPresensi > 0
												? "text-2xl font-bold"
												: "text-sm text-muted-foreground"
										}`}
									>
										{totalPresensi > 0
											? `${hadirCount}/${totalPresensi}`
											: "Belum ada data kehadiran"}
									</p>
								</div>
								<div className={`${cardClass} p-5`}>
									<div className="flex items-center gap-2 text-muted-foreground">
										<HugeiconsIcon icon={History} className="size-5" />
										<span className="text-xs font-medium">Nilai Terakhir</span>
									</div>
									<p
										className={`mt-2 ${
											lastGrade
												? "text-2xl font-bold"
												: "text-sm text-muted-foreground"
										}`}
									>
										{lastGrade || "Belum Dinilai"}
									</p>
								</div>
							</div>

							{/* Riwayat Setoran */}
							<div className={`${cardClass} p-5`}>
								<h3 className="text-sm font-semibold">Riwayat Setoran</h3>
								{recent.length > 0 ? (
									<>
										<div className="mt-3 space-y-2">
											{recent
												.slice(0, showAllHistory ? recent.length : 5)
												.map((s) => {
													return (
														<div
															key={s.id}
															className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5"
														>
															<div className="flex items-center gap-3">
																<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background">
																	<HugeiconsIcon
																		icon={
																			s.type === "Ziyadah" ? BookOpen : Repeat
																		}
																		className="size-4"
																	/>
																</div>
																<div>
																	<p className="text-sm font-medium">
																		{typeLabel(s.type)} — {surahName(s)}
																	</p>
																	<p className="text-xs text-muted-foreground">
																		Ayat {s.ayatAwal}–{s.ayatAkhir} ·{" "}
																		{formatDate(s.tanggal)}
																	</p>
																</div>
															</div>
															<span
																className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
																	STATUS_COLORS[s.status] ||
																	"bg-muted text-muted-foreground"
																}`}
															>
																{s.status}
															</span>
														</div>
													);
												})}
										</div>
										{recent.length > 5 && (
											<Button
												variant="ghost"
												size="sm"
												className="mt-3 w-full min-h-11"
												onClick={() => setShowAllHistory((v) => !v)}
											>
												{showAllHistory ? "Sembunyikan" : "Lihat Semua Riwayat"}
											</Button>
										)}
									</>
								) : (
									<div className="flex flex-col items-center gap-2.5 py-10 text-center">
										<div className="flex size-16 items-center justify-center rounded-full bg-muted">
											<HugeiconsIcon
												icon={History}
												className="size-7 text-muted-foreground"
											/>
										</div>
										<p className="text-sm font-medium">
											Belum ada riwayat setoran.
										</p>
										<p className="text-xs text-muted-foreground/80">
											Riwayat setoran akan muncul di sini setelah musyrif
											mencatat.
										</p>
									</div>
								)}
							</div>
						</main>
					) : (
						<main className="mt-6">
							<div className="rounded-2xl border bg-card p-8 text-center shadow-xs">
								<p className="text-sm text-muted-foreground">
									Data siswa tidak ditemukan.
								</p>
							</div>
						</main>
					)}

					{/* Footer */}
					<footer className="mt-8 border-t pt-6 text-center">
						<p className="text-xs text-muted-foreground">
							{lastUpdated
								? `Data terakhir diperbarui: ${formatDate(lastUpdated)}`
								: "Belum ada data untuk ditampilkan."}
						</p>
						<p className="mt-1 text-xs font-medium text-foreground/70">
							Portal Orang Tua – Sijil Mutaba'ah
						</p>
					</footer>
				</div>
			</div>
		</div>
	);
}

function formatDate(date: string) {
	return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}
