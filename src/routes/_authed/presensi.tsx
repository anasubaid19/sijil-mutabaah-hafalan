import { CalendarCheck } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { localDateString } from "@/lib/utils";

interface Siswa {
	id: string;
	nama: string;
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

export const Route = createFileRoute("/_authed/presensi")({
	component: PresensiPage,
});

function todayStr() {
	return localDateString();
}

function PresensiPage() {
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [presensiList, setPresensiList] = useState<Presensi[]>([]);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<PresensiStatus | "all">(
		"all",
	);
	const [rowFeedback, setRowFeedback] = useState<
		Record<string, "saving" | "saved" | "error">
	>({});

	const today = todayStr();

	useEffect(() => {
		async function load() {
			try {
				const [sRes, pRes] = await Promise.all([
					fetch("/api/siswa"),
					fetch(`/api/presensi?tanggal=${today}`),
				]);
				if (sRes.ok) setSiswaList(await sRes.json());
				if (pRes.ok) setPresensiList(await pRes.json());
			} catch {}
			setLoading(false);
		}
		load();
	}, [today]);

	const presensiMap = new Map(presensiList.map((p) => [p.siswaId, p]));
	const hadirCount = presensiList.filter((p) => p.status === "Hadir").length;

	const handlePresensiChange = useCallback(
		async (siswaId: string, status: PresensiStatus) => {
			setRowFeedback((prev) => ({ ...prev, [siswaId]: "saving" }));
			try {
				const existing = presensiMap.get(siswaId);
				if (existing && existing.status === status) {
					const res = await fetch(`/api/presensi?id=${existing.id}`, {
						method: "DELETE",
					});
					if (!res.ok) throw new Error("delete failed");
					setPresensiList((prev) => prev.filter((p) => p.siswaId !== siswaId));
				} else if (existing) {
					const res = await fetch("/api/presensi", {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ id: existing.id, status }),
					});
					if (!res.ok) throw new Error("update failed");
					setPresensiList((prev) =>
						prev.map((p) => (p.siswaId === siswaId ? { ...p, status } : p)),
					);
				} else {
					const res = await fetch("/api/presensi", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ siswaId, tanggal: today, status }),
					});
					if (!res.ok) throw new Error("create failed");
					const row = await res.json();
					setPresensiList((prev) => [...prev, row]);
				}
				setRowFeedback((prev) => ({ ...prev, [siswaId]: "saved" }));
				window.setTimeout(() => {
					setRowFeedback((prev) => {
						const next = { ...prev };
						delete next[siswaId];
						return next;
					});
				}, 1800);
			} catch {
				setRowFeedback((prev) => ({ ...prev, [siswaId]: "error" }));
				toast.error("Presensi gagal disimpan. Periksa koneksi dan coba lagi.");
			}
		},
		[today, presensiMap],
	);

	const markAllPresent = useCallback(async () => {
		setBusy(true);
		try {
			const promises = siswaList
				.filter(
					(s) =>
						!presensiMap.has(s.id) ||
						presensiMap.get(s.id)?.status !== "Hadir",
				)
				.map(async (s) => {
					const existing = presensiMap.get(s.id);
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
			toast.success("Semua siswa ditandai Hadir");
		} catch {
			toast.error("Gagal menyimpan presensi");
		} finally {
			setBusy(false);
		}
	}, [siswaList, presensiMap, today]);

	const resetPresensi = useCallback(async () => {
		const snapshot = [...presensiList];
		setBusy(true);
		try {
			const promises = snapshot.map((p) =>
				fetch(`/api/presensi?id=${p.id}`, { method: "DELETE" }),
			);
			await Promise.all(promises);
			setPresensiList([]);
			toast.success("Presensi hari ini dikosongkan", {
				action: {
					label: "Batalkan",
					onClick: async () => {
						try {
							await Promise.all(
								snapshot.map((p) =>
									fetch("/api/presensi", {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({
											siswaId: p.siswaId,
											tanggal: p.tanggal,
											status: p.status,
										}),
									}),
								),
							);
							const pRes = await fetch(`/api/presensi?tanggal=${today}`);
							if (pRes.ok) setPresensiList(await pRes.json());
						} catch {}
					},
				},
			});
		} catch {
			toast.error("Gagal mengosongkan presensi");
		} finally {
			setBusy(false);
		}
	}, [presensiList, today]);

	const filtered = siswaList.filter(
		(s) =>
			s.nama.toLowerCase().includes(search.toLowerCase()) &&
			(statusFilter === "all" ||
				presensiMap.get(s.id)?.status === statusFilter),
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-sm text-muted-foreground">Memuat...</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl space-y-5 pb-20 md:pb-6">
			<div>
				<h2 className="text-base font-semibold">Presensi</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					{hadirCount}/{siswaList.length} Hadir —{" "}
					{new Date(`${today}T00:00:00`).toLocaleDateString("id-ID", {
						weekday: "long",
						day: "numeric",
						month: "long",
						year: "numeric",
					})}
				</p>
			</div>

			{/* Controls */}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={markAllPresent}
					disabled={busy}
				>
					{busy ? "Menyimpan..." : "Semua Hadir"}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setResetOpen(true)}
					disabled={busy}
				>
					Atur Ulang
				</Button>
				<div className="ml-auto flex items-center gap-2">
					<Input
						aria-label="Cari siswa"
						placeholder="Cari siswa…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-40"
					/>
				</div>
			</div>

			{/* Status filter */}
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					aria-pressed={statusFilter === "all"}
					aria-label="Filter semua status"
					onClick={() => setStatusFilter("all")}
					className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
						statusFilter === "all"
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:bg-muted/80"
					}`}
				>
					Semua
				</button>
				{PRESENSI_STATUSES.map((st) => (
					<button
						key={st}
						type="button"
						aria-pressed={statusFilter === st}
						aria-label={`Filter status ${st}`}
						onClick={() => setStatusFilter(st)}
						className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
							statusFilter === st
								? CHIP_ACTIVE[st]
								: `${CHIP_COLORS[st]} hover:opacity-80`
						}`}
					>
						{st}
					</button>
				))}
			</div>

			{/* Legend */}
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
				<span className="inline-flex items-center gap-1">
					<span className="inline-block size-2 rounded-sm bg-emerald-500" />H =
					Hadir
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

			{/* Student List */}
			{filtered.length > 0 ? (
				<div className="space-y-2">
					{filtered.map((s) => {
						const current = presensiMap.get(s.id)?.status;
						return (
							<div
								key={s.id}
							className="grid items-center gap-2 rounded-xl border border-transparent bg-muted/40 px-3 py-2 transition-[border-color,background-color] hover:border-border hover:bg-muted/60 sm:grid-cols-[minmax(0,1fr)_auto_5.5rem]"
						>
							<span className="min-w-0 truncate text-sm font-medium">{s.nama}</span>
							<div className="flex gap-1 justify-self-start sm:justify-self-end">
									{PRESENSI_STATUSES.map((st) => (
										<button
											type="button"
											key={st}
											aria-pressed={current === st}
											aria-label={`Tandai ${s.nama}: ${st}`}
										onClick={() => handlePresensiChange(s.id, st)}
										disabled={rowFeedback[s.id] === "saving"}
										className={`min-h-9 min-w-9 rounded-lg px-2 py-1 text-xs font-semibold transition-[background-color,color,box-shadow] pointer-coarse:min-h-11 pointer-coarse:min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 ${
												current === st ? CHIP_ACTIVE[st] : CHIP_COLORS[st]
											}`}
										>
											{st[0]}
										</button>
								))}
							</div>
							<span
								role="status"
								className={`text-xs font-medium sm:text-right ${
									rowFeedback[s.id] === "error"
										? "text-destructive"
										: "text-emerald-700 dark:text-emerald-400"
								}`}
							>
								{rowFeedback[s.id] === "saving"
									? "Menyimpan…"
									: rowFeedback[s.id] === "saved"
										? "✓ Tersimpan"
										: rowFeedback[s.id] === "error"
											? "Gagal"
											: ""}
							</span>
							</div>
						);
					})}
				</div>
			) : (
				<div className="flex flex-col items-center gap-2 py-12">
					<HugeiconsIcon
						icon={CalendarCheck}
						className="size-8 text-muted-foreground/30"
						strokeWidth={1.5}
					/>
					<p className="text-sm text-muted-foreground">
						{siswaList.length === 0
							? "Belum ada siswa"
							: "Tidak ada hasil dengan filter ini"}
					</p>
				</div>
			)}

			{/* Reset confirmation */}
			<AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Kosongkan presensi hari ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Status kehadiran semua siswa untuk tanggal ini akan dihapus.
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
							Kosongkan
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
