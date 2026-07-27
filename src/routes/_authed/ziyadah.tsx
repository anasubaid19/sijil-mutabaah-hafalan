import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MushafPanel } from "@/components/mushaf-panel";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
	findSurah,
	SURAH_DATA,
	type Surah,
	searchSurah,
	validateAyat,
} from "@/lib/surah-data";

interface Siswa {
	id: string;
	nama: string;
}

const GRADES = ["Jayyid", "Jayyid Jiddan", "Mumtaz", "Mutqin"];
const GRADE_COLORS: Record<string, string> = {
	Jayyid: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
	"Jayyid Jiddan":
		"bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
	Mumtaz:
		"bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
	Mutqin: "bg-primary/15 text-primary border-primary/30",
};

export const Route = createFileRoute("/_authed/ziyadah")({
	component: ZiyadahPage,
});

function ZiyadahPage() {
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [selectedSiswa, setSelectedSiswa] = useState("");
	const [tanggal, setTanggal] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [surahA, setSurahA] = useState("");
	const [dariAyat, setDariAyat] = useState("");
	const [sampaiAyat, setSampaiAyat] = useState("");
	const [gred, setGred] = useState("Mumtaz");
	const [catatan, setCatatan] = useState("");
	const [loading, setLoading] = useState(false);
	const [dariAyatError, setDariAyatError] = useState("");
	const [sampaiAyatError, setSampaiAyatError] = useState("");

	const [acA, setAcA] = useState<Surah[]>([]);
	const [mushafOpen, setMushafOpen] = useState(false);
	const [mushafMobileOpen, setMushafMobileOpen] = useState(false);

	const [panelSize, setPanelSize] = useState(() => {
		if (typeof window === "undefined") return 40;
		return Number.parseInt(localStorage.getItem("sijil_ziyadah_panel") ?? "40", 10);
	});

	const [lintasMode, setLintasMode] = useState(false);
	const [lintasSurahEnd, setLintasSurahEnd] = useState("");
	const [lintasSampaiAyat, setLintasSampaiAyat] = useState("");
	const [lintasAcEnd, setLintasAcEnd] = useState<Surah[]>([]);
	const [lintasSampaiError, setLintasSampaiError] = useState("");

	useEffect(() => {
		fetch("/api/siswa")
			.then((r) => {
				if (r.ok) return r.json();
				throw new Error();
			})
			.then(setSiswaList)
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!selectedSiswa) return;
		fetch(`/api/setoran?siswaId=${selectedSiswa}`)
			.then((r) => {
				if (r.ok) return r.json();
				throw new Error();
			})
			.then(
				(data: { surah?: number; ayatAwal?: number; ayatAkhir?: number }[]) => {
					if (data.length > 0) {
						const last = data[0];
						if (last.surah) {
							const s = SURAH_DATA.find((s) => s.number === last.surah);
							if (s) setSurahA(s.name);
						}
						if (last.ayatAkhir) setDariAyat(String(last.ayatAkhir + 1));
					}
				},
			)
			.catch(() => {});
	}, [selectedSiswa]);

	function handleSurahAChange(val: string) {
		setSurahA(val);
		setAcA(val.length >= 1 ? searchSurah(val).slice(0, 5) : []);
	}

	function selectSurahA(s: Surah) {
		setSurahA(s.name);
		setAcA([]);
	}

	function handleLintasSurahEndChange(val: string) {
		setLintasSurahEnd(val);
		setLintasAcEnd(val.length >= 1 ? searchSurah(val).slice(0, 5) : []);
	}

	function selectLintasSurahEnd(s: Surah) {
		setLintasSurahEnd(s.name);
		setLintasAcEnd([]);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!selectedSiswa || !surahA || !dariAyat) {
			toast.error("Lengkapi semua field yang diperlukan");
			return;
		}

		const dariErr = validateAyat(surahA, dariAyat);
		if (dariErr) {
			setDariAyatError(dariErr);
			return;
		}

		if (lintasMode) {
			if (!lintasSurahEnd || !lintasSampaiAyat) {
				toast.error("Lengkapi Surah End dan Sampai Ayat");
				return;
			}
			const endSurah = findSurah(lintasSurahEnd);
			if (!endSurah) {
				toast.error("Surah End tidak ditemukan");
				return;
			}
			const lintasSampaiErr = validateAyat(lintasSurahEnd, lintasSampaiAyat);
			if (lintasSampaiErr) {
				setLintasSampaiError(lintasSampaiErr);
				return;
			}

			setLoading(true);
			const surahAData = findSurah(surahA);

			const res1 = await fetch("/api/setoran", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					siswaId: selectedSiswa,
					type: "Ziyadah",
					tanggal,
					surah: surahAData?.number ?? 0,
					ayatAwal: Number.parseInt(dariAyat, 10) || 0,
					ayatAkhir: surahAData?.ayatCount ?? 0,
					status: gred,
					catatan,
				}),
			});

			const res2 = await fetch("/api/setoran", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					siswaId: selectedSiswa,
					type: "Ziyadah",
					tanggal,
					surah: endSurah.number,
					ayatAwal: 1,
					ayatAkhir: Number.parseInt(lintasSampaiAyat, 10) || 0,
					status: gred,
					catatan,
				}),
			});

			setLoading(false);

			if (res1.ok && res2.ok) {
				toast.success("Ziyadah lintas surah tersimpan!");
				resetForm();
			} else {
				toast.error("Gagal menyimpan salah satu setoran");
			}
		} else {
			if (!sampaiAyat) {
				toast.error("Isi Sampai Ayat");
				return;
			}
			const sampaiErr = validateAyat(surahA, sampaiAyat);
			if (sampaiErr) {
				setSampaiAyatError(sampaiErr);
				return;
			}

			setLoading(true);
			const res = await fetch("/api/setoran", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					siswaId: selectedSiswa,
					type: "Ziyadah",
					tanggal,
					surah: findSurah(surahA)?.number ?? 0,
					ayatAwal: Number.parseInt(dariAyat, 10) || 0,
					ayatAkhir:
						Number.parseInt(sampaiAyat, 10) ||
						Number.parseInt(dariAyat, 10) ||
						0,
					status: gred,
					catatan,
				}),
			});

			setLoading(false);

			if (res.ok) {
				toast.success("Ziyadah tersimpan!");
				resetForm();
			} else {
				toast.error("Gagal menyimpan");
			}
		}
	}

	function resetForm() {
		setSurahA("");
		setDariAyat("");
		setSampaiAyat("");
		setDariAyatError("");
		setSampaiAyatError("");
		setCatatan("");
		setLintasSurahEnd("");
		setLintasSampaiAyat("");
		setLintasSampaiError("");
	}

	function handleMushafSelect(
		surah: string,
		ayatAwal: number,
		ayatAkhir: number,
	) {
		setSurahA(surah);
		setDariAyat(String(ayatAwal));
		setSampaiAyat(String(ayatAkhir));
		setMushafOpen(false);
		setMushafMobileOpen(false);
	}

	function savePanelSize(sizes: number[]) {
		const [, right] = sizes;
		if (right !== undefined) {
			setPanelSize(right);
			localStorage.setItem("sijil_ziyadah_panel", String(Math.round(right)));
		}
	}

	return (
		<div className="mx-auto max-w-7xl space-y-4 pb-20 md:pb-6">
			<div>
				<h2 className="text-base font-semibold">
					Ziyadah — Tambah Hafalan Baru
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Catat setoran ziyadah untuk siswa
				</p>
			</div>

			<div className="hidden lg:block">
				<ResizablePanelGroup
					direction="horizontal"
					className="gap-3"
					onLayout={savePanelSize}
				>
					<ResizablePanel defaultSize={100 - panelSize} minSize={30}>
						<FormBody />
					</ResizablePanel>
					{mushafOpen && (
						<>
							<ResizableHandle withHandle />
							<ResizablePanel defaultSize={panelSize} minSize={25}>
								<div className="sticky top-4">
									<MushafPanel
										open={mushafOpen}
										onClose={() => setMushafOpen(false)}
										mode="input"
										onSelect={handleMushafSelect}
									/>
								</div>
							</ResizablePanel>
						</>
					)}
				</ResizablePanelGroup>
			</div>

			<div className="lg:hidden">
				<FormBody />
			</div>

			<Dialog open={mushafMobileOpen} onOpenChange={setMushafMobileOpen}>
				<DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden p-0">
					<DialogHeader className="px-4 pt-4">
						<DialogTitle>Pilih Ayat</DialogTitle>
					</DialogHeader>
					<div className="overflow-y-auto max-h-[80vh]">
						<MushafPanel
							open={mushafMobileOpen}
							onClose={() => setMushafMobileOpen(false)}
							mode="input"
							onSelect={handleMushafSelect}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);

	function FormBody() {
		return (
			<form
				onSubmit={handleSubmit}
				className="rounded-2xl border bg-card p-4 shadow-xs space-y-4"
			>
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-2">
						<label className="text-sm font-medium">Siswa</label>
						<select
							value={selectedSiswa}
							onChange={(e) => setSelectedSiswa(e.target.value)}
							required
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
						>
							<option value="">Pilih siswa...</option>
							{siswaList.map((s) => (
								<option key={s.id} value={s.id}>
									{s.nama}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Tanggal</label>
						<Input
							type="date"
							value={tanggal}
							onChange={(e) => setTanggal(e.target.value)}
							required
						/>
					</div>
				</div>

				<div
					className={`grid gap-3 ${lintasMode ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
				>
					<div className="relative space-y-2">
						<label className="text-sm font-medium">Surah</label>
						<Input
							type="text"
							value={surahA}
							onChange={(e) => handleSurahAChange(e.target.value)}
							placeholder="Ketik nama surah..."
							required
						/>
						{acA.length > 0 && (
							<div className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg">
								{acA.map((s) => (
									<button
										key={s.number}
										type="button"
										onClick={() => selectSurahA(s)}
										className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl"
									>
										<span>{s.name}</span>
										<span className="text-xs text-muted-foreground">
											{s.ayatCount} ayat
										</span>
									</button>
								))}
							</div>
						)}
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Dari Ayat</label>
						<Input
							type="text"
							value={dariAyat}
							onChange={(e) => {
								setDariAyat(e.target.value);
								setDariAyatError("");
							}}
							onBlur={() => {
								const err = validateAyat(surahA, dariAyat);
								setDariAyatError(err ?? "");
							}}
							placeholder="Ayat awal"
							required
						/>
						{dariAyatError && (
							<p className="text-xs text-destructive">{dariAyatError}</p>
						)}
					</div>
					{!lintasMode && (
						<div className="space-y-2">
							<label className="text-sm font-medium">Sampai Ayat</label>
							<Input
								type="text"
								value={sampaiAyat}
								onChange={(e) => {
									setSampaiAyat(e.target.value);
									setSampaiAyatError("");
								}}
								onBlur={() => {
									const err = validateAyat(surahA, sampaiAyat);
									setSampaiAyatError(err ?? "");
								}}
								placeholder="Ayat akhir"
								required
							/>
							{sampaiAyatError && (
								<p className="text-xs text-destructive">{sampaiAyatError}</p>
							)}
						</div>
					)}
				</div>

				{lintasMode && (
					<div className="rounded-xl bg-muted/30 p-3 border border-dashed border-primary/30">
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="relative space-y-2">
								<label className="text-sm font-medium text-primary">
									Surah End
								</label>
								<Input
									type="text"
									value={lintasSurahEnd}
									onChange={(e) => handleLintasSurahEndChange(e.target.value)}
									placeholder="Surah tujuan..."
									required
								/>
								{lintasAcEnd.length > 0 && (
									<div className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg">
										{lintasAcEnd.map((s) => (
											<button
												key={s.number}
												type="button"
												onClick={() => selectLintasSurahEnd(s)}
												className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl"
											>
												<span>{s.name}</span>
												<span className="text-xs text-muted-foreground">
													{s.ayatCount} ayat
												</span>
											</button>
										))}
									</div>
								)}
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium text-primary">
									Sampai Ayat
								</label>
								<Input
									type="text"
									value={lintasSampaiAyat}
									onChange={(e) => {
										setLintasSampaiAyat(e.target.value);
										setLintasSampaiError("");
									}}
									onBlur={() => {
										const err = validateAyat(lintasSurahEnd, lintasSampaiAyat);
										setLintasSampaiError(err ?? "");
									}}
									placeholder="Ayat akhir surah tujuan"
									required
								/>
								{lintasSampaiError && (
									<p className="text-xs text-destructive">
										{lintasSampaiError}
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							window.innerWidth >= 1024
								? setMushafOpen(!mushafOpen)
								: setMushafMobileOpen(true)
						}
					>
						<HugeiconsIcon icon={BookOpen01Icon} className="w-4 h-4 mr-1.5" />
						{mushafOpen ? "Tutup Mushaf" : "Buka Mushaf"}
					</Button>
					<Button
						type="button"
						variant={lintasMode ? "default" : "outline"}
						size="sm"
						onClick={() => {
							setLintasMode(!lintasMode);
							if (lintasMode) {
								setLintasSurahEnd("");
								setLintasSampaiAyat("");
								setLintasSampaiError("");
							}
						}}
					>
						{lintasMode ? "✕ Tutup Lintas" : "Lintas Surah"}
					</Button>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Penilaian</label>
					<div className="flex flex-wrap gap-2">
						{GRADES.map((g) => (
							<button
								key={g}
								type="button"
								onClick={() => setGred(g)}
								className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
									gred === g
										? GRADE_COLORS[g]
										: "border-border text-muted-foreground hover:bg-muted/50"
								}`}
							>
								{g}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Catatan (opsional)</label>
					<textarea
						value={catatan}
						onChange={(e) => setCatatan(e.target.value)}
						placeholder="Catatan tambahan..."
						rows={3}
						className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none md:text-sm"
					/>
				</div>

				<div className="sticky bottom-16 z-10 -mx-1 -mb-1 bg-card px-1 pb-1 pt-3">
					<Button type="submit" disabled={loading} className="w-full">
						{loading
							? "Menyimpan..."
							: lintasMode
								? "Simpan 2 Setoran Lintas"
								: "Simpan Ziyadah"}
					</Button>
				</div>
			</form>
		);
	}
}
