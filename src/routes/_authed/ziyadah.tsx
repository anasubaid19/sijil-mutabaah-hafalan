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

	// Lintas surah state
	const [lintasOpen, setLintasOpen] = useState(false);
	const [lintasRanges, setLintasRanges] = useState<
		{ surah: string; surahNum: number; dari: number; sampai: number }[]
	>([]);
	const [lintasSurah, setLintasSurah] = useState("");
	const [lintasDari, setLintasDari] = useState("");
	const [lintasSampai, setLintasSampai] = useState("");
	const [lintasAc, setLintasAc] = useState<Surah[]>([]);
	const [lintasLoading, setLintasLoading] = useState(false);

	useEffect(() => {
		fetch("/api/siswa")
			.then((r) => {
				if (r.ok) return r.json();
				throw new Error();
			})
			.then(setSiswaList)
			.catch(() => {});
	}, []);

	// Phase 5: auto-fill dari last setoran when siswa selected
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
		if (val.length >= 1) {
			setAcA(searchSurah(val).slice(0, 5));
		} else {
			setAcA([]);
		}
	}

	function selectSurahA(s: Surah) {
		setSurahA(s.name);
		setAcA([]);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!selectedSiswa || !surahA || !dariAyat || !sampaiAyat) {
			toast.error("Lengkapi semua field yang diperlukan");
			return;
		}

		const dariErr = validateAyat(surahA, dariAyat);
		if (dariErr) {
			setDariAyatError(dariErr);
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
					Number.parseInt(sampaiAyat, 10) || Number.parseInt(dariAyat, 10) || 0,
				status: gred,
				catatan,
			}),
		});

		setLoading(false);

		if (res.ok) {
			toast.success("Ziyadah tersimpan!");
			setSurahA("");
			setDariAyat("");
			setSampaiAyat("");
			setDariAyatError("");
			setSampaiAyatError("");
			setCatatan("");
		} else {
			toast.error("Gagal menyimpan");
		}
	}

	// Shared mushaf select handler
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

	// Lintas surah handlers
	function handleLintasSurahChange(val: string) {
		setLintasSurah(val);
		setLintasAc(val.length >= 1 ? searchSurah(val).slice(0, 5) : []);
	}

	function addLintasRange() {
		if (!lintasSurah || !lintasDari || !lintasSampai) return;
		const s = findSurah(lintasSurah);
		if (!s) {
			toast.error("Surah tidak ditemukan");
			return;
		}
		const dari = Number.parseInt(lintasDari, 10);
		const sampai = Number.parseInt(lintasSampai, 10);
		if (!dari || !sampai || dari > sampai || dari < 1 || sampai > s.ayatCount) {
			toast.error(`Ayat tidak valid (1-${s.ayatCount})`);
			return;
		}
		setLintasRanges((prev) => [
			...prev,
			{ surah: s.name, surahNum: s.number, dari, sampai },
		]);
		setLintasSurah("");
		setLintasDari("");
		setLintasSampai("");
		setLintasAc([]);
	}

	function removeLintasRange(idx: number) {
		setLintasRanges((prev) => prev.filter((_, i) => i !== idx));
	}

	async function submitLintas() {
		if (!selectedSiswa || lintasRanges.length === 0) return;
		setLintasLoading(true);
		let ok = 0;
		for (const r of lintasRanges) {
			const res = await fetch("/api/setoran", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					siswaId: selectedSiswa,
					type: "Ziyadah",
					tanggal,
					surah: r.surahNum,
					ayatAwal: r.dari,
					ayatAkhir: r.sampai,
					status: gred,
					catatan,
				}),
			});
			if (res.ok) ok++;
		}
		setLintasLoading(false);
		if (ok === lintasRanges.length) {
			toast.success(`${ok} setoran lintas surah tersimpan!`);
			setLintasRanges([]);
			setLintasOpen(false);
		} else {
			toast.error(`${ok}/${lintasRanges.length} berhasil disimpan`);
		}
	}

	const formEl = (
		<form
			onSubmit={handleSubmit}
			className="space-y-5 rounded-2xl border bg-card p-5 shadow-xs"
		>
			{/* Siswa & Tanggal */}
			<div className="grid gap-4 sm:grid-cols-2">
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

			{/* Surah, Dari Ayat, Sampai Ayat */}
			<div className="grid gap-4 sm:grid-cols-3">
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
			</div>

			{/* Buka Mushaf + Lintas Surah — hidden on lg+ (desktop shows panel inline) */}
			<div className="flex gap-2 lg:hidden">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setMushafMobileOpen(true)}
				>
					<HugeiconsIcon icon={BookOpen01Icon} className="w-4 h-4 mr-1.5" />
					Buka Mushaf
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setLintasOpen(true)}
				>
					Lintas Surah
				</Button>
			</div>

			{/* Grade */}
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

			{/* Catatan */}
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

			{/* Submit */}
			<Button type="submit" disabled={loading} className="w-full">
				{loading ? "Menyimpan..." : "Simpan Ziyadah"}
			</Button>
		</form>
	);

	const mushafPanel = (
		<MushafPanel
			open={mushafOpen}
			onClose={() => setMushafOpen(false)}
			mode="input"
			onSelect={handleMushafSelect}
		/>
	);

	return (
		<div className="mx-auto max-w-5xl space-y-6 pb-20 md:pb-6">
			<div>
				<h2 className="text-base font-semibold">
					Ziyadah — Tambah Hafalan Baru
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Catat setoran ziyadah untuk siswa
				</p>
			</div>

			{/* Phase 1+2: Desktop side-by-side, mobile stacked */}
			<div className="grid gap-6 lg:grid-cols-[1fr_420px]">
				{/* Form */}
				<div>{formEl}</div>

				{/* Desktop: inline mushaf panel */}
				<div className="hidden lg:block">
					<div className="sticky top-4">
						<div className="flex gap-2 mb-3">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setMushafOpen(!mushafOpen)}
							>
								<HugeiconsIcon
									icon={BookOpen01Icon}
									className="w-4 h-4 mr-1.5"
								/>
								{mushafOpen ? "Tutup Mushaf" : "Buka Mushaf"}
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setLintasOpen(true)}
							>
								Lintas Surah
							</Button>
						</div>
						{mushafPanel}
					</div>
				</div>
			</div>

			{/* Mobile: mushaf in dialog */}
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

			{/* Lintas Surah dialog */}
			<Dialog open={lintasOpen} onOpenChange={setLintasOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Lintas Surah</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						{lintasRanges.length > 0 && (
							<div className="space-y-1.5">
								{lintasRanges.map((r, i) => (
									<div
										key={`${r.surahNum}-${r.dari}-${r.sampai}`}
										className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
									>
										<span>
											{r.surah} {r.dari}–{r.sampai}
										</span>
										<button
											type="button"
											onClick={() => removeLintasRange(i)}
											className="text-xs text-destructive hover:underline"
										>
											Hapus
										</button>
									</div>
								))}
							</div>
						)}
						<div className="grid gap-2 grid-cols-[1fr_auto_auto] items-end">
							<div className="relative space-y-1">
								<label className="text-xs font-medium">Surah</label>
								<Input
									type="text"
									value={lintasSurah}
									onChange={(e) => handleLintasSurahChange(e.target.value)}
									placeholder="Nama surah..."
									className="h-8 text-sm"
								/>
								{lintasAc.length > 0 && (
									<div className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg">
										{lintasAc.map((s) => (
											<button
												key={s.number}
												type="button"
												onClick={() => {
													setLintasSurah(s.name);
													setLintasAc([]);
												}}
												className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl"
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
							<div className="space-y-1">
								<label className="text-xs font-medium">Dari</label>
								<Input
									type="number"
									value={lintasDari}
									onChange={(e) => setLintasDari(e.target.value)}
									placeholder="#"
									className="h-8 w-16 text-sm"
									min={1}
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-medium">Sampai</label>
								<Input
									type="number"
									value={lintasSampai}
									onChange={(e) => setLintasSampai(e.target.value)}
									placeholder="#"
									className="h-8 w-16 text-sm"
									min={1}
								/>
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addLintasRange}
							disabled={!lintasSurah || !lintasDari || !lintasSampai}
						>
							+ Tambah Range
						</Button>
						<div className="flex gap-2 justify-end border-t pt-3">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									setLintasOpen(false);
									setLintasRanges([]);
								}}
							>
								Batal
							</Button>
							<Button
								size="sm"
								onClick={submitLintas}
								disabled={lintasLoading || lintasRanges.length === 0}
							>
								{lintasLoading
									? "Menyimpan..."
									: `Simpan ${lintasRanges.length} Setoran`}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
