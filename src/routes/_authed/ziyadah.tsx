import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MushafPanel } from "@/components/mushaf-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	findSurah,
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
	const [ayatA, setAyatA] = useState("");
	const [surahB, setSurahB] = useState("");
	const [ayatB, setAyatB] = useState("");
	const [gred, setGred] = useState("Mumtaz");
	const [catatan, setCatatan] = useState("");
	const [lintas, setLintas] = useState(false);
	const [loading, setLoading] = useState(false);
	const [ayatAError, setAyatAError] = useState("");
	const [ayatBError, setAyatBError] = useState("");

	const [acA, setAcA] = useState<Surah[]>([]);
	const [acB, setAcB] = useState<Surah[]>([]);
	const showAcA = useRef(false);
	const showAcB = useRef(false);
	const [mushafOpen, setMushafOpen] = useState(false);

	useEffect(() => {
		fetch("/api/siswa")
			.then((r) => {
				if (r.ok) return r.json();
				throw new Error();
			})
			.then(setSiswaList)
			.catch(() => {});
	}, []);

	function handleSurahAChange(val: string) {
		setSurahA(val);
		if (val.length >= 1) {
			setAcA(searchSurah(val).slice(0, 5));
			showAcA.current = true;
		} else {
			setAcA([]);
		}
	}

	function handleSurahBChange(val: string) {
		setSurahB(val);
		if (val.length >= 1) {
			setAcB(searchSurah(val).slice(0, 5));
			showAcB.current = true;
		} else {
			setAcB([]);
		}
	}

	function selectSurahA(s: Surah) {
		setSurahA(s.name);
		setAcA([]);
	}

	function selectSurahB(s: Surah) {
		setSurahB(s.name);
		setAcB([]);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!selectedSiswa || !surahA || !ayatA) {
			toast.error("Lengkapi semua field yang diperlukan");
			return;
		}

		const ayatError = validateAyat(surahA, ayatA);
		if (ayatError) {
			setAyatAError(ayatError);
			return;
		}
		if (surahB && ayatB) {
			const ayatBErr = validateAyat(surahB, ayatB);
			if (ayatBErr) {
				setAyatBError(ayatBErr);
				return;
			}
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
				ayatAwal: Number.parseInt(ayatA, 10) || 0,
				ayatAkhir:
					Number.parseInt(ayatB, 10) || Number.parseInt(ayatA, 10) || 0,
				status: gred,
				catatan,
			}),
		});

		setLoading(false);

		if (res.ok) {
			toast.success("Ziyadah tersimpan!");
			setSurahA("");
			setAyatA("");
			setSurahB("");
			setAyatB("");
			setAyatAError("");
			setAyatBError("");
			setCatatan("");
		} else {
			toast.error("Gagal menyimpan");
		}
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6 pb-20 md:pb-6">
			<div>
				<h2 className="text-base font-semibold">
					Ziyadah — Tambah Hafalan Baru
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Catat setoran ziyadah untuk siswa
				</p>
			</div>

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

				{/* Surah & Ayat */}
				<div className="grid gap-4 sm:grid-cols-2">
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
						<label className="text-sm font-medium">Ayat</label>
						<Input
							type="text"
							value={ayatA}
							onChange={(e) => {
								setAyatA(e.target.value);
								setAyatAError("");
							}}
							onBlur={() => {
								const err = validateAyat(surahA, ayatA);
								setAyatAError(err ?? "");
							}}
							placeholder="Contoh: 1-5 atau 1"
							required
						/>
						{ayatAError && (
							<p className="text-xs text-destructive">{ayatAError}</p>
						)}
					</div>
				</div>

				{/* Buka Mushaf */}
				<div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setMushafOpen(!mushafOpen)}
					>
						<HugeiconsIcon icon={BookOpen01Icon} className="w-4 h-4 mr-1.5" />
						{mushafOpen ? "Tutup Mushaf" : "Buka Mushaf"}
					</Button>
				</div>

				{/* Lintas Surah */}
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setLintas(!lintas)}
						className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
							lintas
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground"
						}`}
					>
						Lintas Surah
					</button>
				</div>

				{lintas && (
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="relative space-y-2">
							<label className="text-sm font-medium">Sampai Surah</label>
							<Input
								type="text"
								value={surahB}
								onChange={(e) => handleSurahBChange(e.target.value)}
								placeholder="Surah akhir..."
							/>
							{acB.length > 0 && (
								<div className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg">
									{acB.map((s) => (
										<button
											key={s.number}
											type="button"
											onClick={() => selectSurahB(s)}
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
							<label className="text-sm font-medium">Sampai Ayat</label>
							<Input
								type="text"
								value={ayatB}
								onChange={(e) => {
									setAyatB(e.target.value);
									setAyatBError("");
								}}
								onBlur={() => {
									const err = validateAyat(surahB, ayatB);
									setAyatBError(err ?? "");
								}}
								placeholder="Ayat akhir..."
							/>
							{ayatBError && (
								<p className="text-xs text-destructive">{ayatBError}</p>
							)}
						</div>
					</div>
				)}

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
					{loading ? "Menyimpan..." : "Simpan Ziyadah"}
				</Button>
			</form>

			<MushafPanel
				open={mushafOpen}
				onClose={() => setMushafOpen(false)}
				mode="input"
				onSelect={(surah, ayatAwal, ayatAkhir) => {
					setSurahA(surah);
					setAyatA(String(ayatAwal));
					setAyatB(String(ayatAkhir));
					setMushafOpen(false);
				}}
			/>
		</div>
	);
}
