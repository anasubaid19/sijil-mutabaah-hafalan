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
	hafalan: number;
}

const JENIS_MURAJAAH = [
	"Murajaah Fardi",
	"Murajaah Bersama",
	"Sabqi",
	"Muraja'ah",
];
const GRADES = ["Jayyid", "Jayyid Jiddan", "Mumtaz", "Mutqin"];
const GRADE_COLORS: Record<string, string> = {
	Jayyid: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
	"Jayyid Jiddan":
		"bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
	Mumtaz:
		"bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
	Mutqin: "bg-primary/15 text-primary border-primary/30",
};

export const Route = createFileRoute("/_authed/murajaah")({
	component: MurajaahPage,
});

function MurajaahPage() {
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [selectedSiswa, setSelectedSiswa] = useState("");
	const [tanggal, setTanggal] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [jenis, setJenis] = useState("Murajaah Fardi");
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
		if (val.length >= 1) setAcA(searchSurah(val).slice(0, 5));
		else setAcA([]);
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
				type: jenis,
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
			toast.success("Murajaah tersimpan!");
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

	const selectedSiswaData = siswaList.find((s) => s.id === selectedSiswa);

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
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

			{/* Quick Stats */}
			{selectedSiswaData && (
				<div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
						<span className="text-lg font-bold">
							{selectedSiswaData.nama.charAt(0)}
						</span>
					</div>
					<div>
						<p className="text-sm font-semibold">{selectedSiswaData.nama}</p>
						<p className="text-xs text-muted-foreground">
							{selectedSiswaData.hafalan} juz terhafal
						</p>
					</div>
				</div>
			)}

			{/* Jenis Murajaah */}
			<div className="space-y-2">
				<label className="text-sm font-medium">Jenis</label>
				<div className="flex flex-wrap gap-2">
					{JENIS_MURAJAAH.map((j) => (
						<button
							key={j}
							type="button"
							onClick={() => setJenis(j)}
							className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
								jenis === j
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							}`}
						>
							{j}
						</button>
					))}
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
									onClick={() => {
										setSurahA(s.name);
										setAcA([]);
									}}
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

			{/* Buka Mushaf — mobile only */}
			<div className="lg:hidden">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setMushafMobileOpen(true)}
				>
					<HugeiconsIcon icon={BookOpen01Icon} className="w-4 h-4 mr-1.5" />
					Buka Mushaf
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
					className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
				/>
			</div>

			{/* Submit */}
			<Button type="submit" disabled={loading} className="w-full">
				{loading ? "Menyimpan..." : "Simpan Murajaah"}
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
				<h2 className="text-base font-semibold">Murajaah — Review Hafalan</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Catat murajaah dan review hafalan siswa
				</p>
			</div>

			{/* Phase 1+2: Desktop side-by-side, mobile stacked */}
			<div className="grid gap-6 lg:grid-cols-[1fr_420px]">
				{/* Form */}
				<div>{formEl}</div>

				{/* Desktop: inline mushaf panel */}
				<div className="hidden lg:block">
					<div className="sticky top-4">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setMushafOpen(!mushafOpen)}
							className="mb-3"
						>
							<HugeiconsIcon icon={BookOpen01Icon} className="w-4 h-4 mr-1.5" />
							{mushafOpen ? "Tutup Mushaf" : "Buka Mushaf"}
						</Button>
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
		</div>
	);
}
