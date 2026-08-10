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
	juzLabel,
} from "@/lib/surah-data";
import { localDateString } from "@/lib/utils";
import {
	nextPositionFromList,
	type SetoranData,
	nextAfter,
} from "@/lib/progress";

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

interface FormBodyProps {
	siswaList: Siswa[];
	selectedSiswa: string;
	setSelectedSiswa: (v: string) => void;
	tanggal: string;
	setTanggal: (v: string) => void;
	surahA: string;
	handleSurahAChange: (v: string) => void;
	acA: Surah[];
	selectSurahA: (s: Surah) => void;
	dariAyat: string;
	setDariAyat: (v: string) => void;
	dariAyatError: string;
	setDariAyatError: (v: string) => void;
	sampaiAyat: string;
	setSampaiAyat: (v: string) => void;
	sampaiAyatError: string;
	setSampaiAyatError: (v: string) => void;
	lintasMode: boolean;
	setLintasMode: (v: boolean) => void;
	lintasSurahEnd: string;
	handleLintasSurahEndChange: (v: string) => void;
	lintasAcEnd: Surah[];
	selectLintasSurahEnd: (s: Surah) => void;
	lintasSampaiAyat: string;
	setLintasSampaiAyat: (v: string) => void;
	lintasSampaiError: string;
	setLintasSampaiError: (v: string) => void;
	gred: string;
	setGred: (v: string) => void;
	catatan: string;
	setCatatan: (v: string) => void;
	loading: boolean;
	handleSubmit: (e: React.FormEvent) => void;
	mushafOpen: boolean;
	setMushafOpen: (v: boolean) => void;
	setMushafMobileOpen: (v: boolean) => void;
	juz: string;
	acActive: number;
	setAcActive: (v: number) => void;
	acEndActive: number;
	setAcEndActive: (v: number) => void;
	setAcA: (v: Surah[]) => void;
	setLintasAcEnd: (v: Surah[]) => void;
}

function FormBody(props: FormBodyProps) {
	return (
		<form
			onSubmit={props.handleSubmit}
			className="rounded-2xl border bg-card p-4 shadow-xs space-y-4"
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-2">
					<label htmlFor="ziyadah-siswa" className="text-sm font-medium">Siswa</label>
					<select
						id="ziyadah-siswa"
						value={props.selectedSiswa}
						onChange={(e) => props.setSelectedSiswa(e.target.value)}
						required
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
					>
						<option value="">Pilih siswa...</option>
						{props.siswaList.map((s) => (
							<option key={s.id} value={s.id}>
								{s.nama}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-2">
					<label htmlFor="ziyadah-tanggal" className="text-sm font-medium">Tanggal</label>
					<Input
						id="ziyadah-tanggal"
						type="date"
						value={props.tanggal}
						onChange={(e) => props.setTanggal(e.target.value)}
						required
					/>
				</div>
			</div>

			<div
				className={`grid gap-3 ${props.lintasMode ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
			>
				<div className="relative space-y-2">
					<label htmlFor="ziyadah-surah" className="text-sm font-medium">Surah</label>
					<Input
						id="ziyadah-surah"
						type="text"
						role="combobox"
						aria-expanded={props.acA.length > 0}
						aria-controls="ziyadah-surah-list"
						aria-activedescendant={
							props.acA.length > 0 && props.acActive >= 0
								? `ziyadah-surah-opt-${props.acA[props.acActive]?.number}`
								: undefined
						}
						value={props.surahA}
						onChange={(e) => props.handleSurahAChange(e.target.value)}
						onKeyDown={(e) => {
							if (props.acA.length === 0) return;
							if (e.key === "ArrowDown") {
								e.preventDefault();
								props.setAcActive((props.acActive + 1) % props.acA.length);
							} else if (e.key === "ArrowUp") {
								e.preventDefault();
								props.setAcActive(
									(props.acActive - 1 + props.acA.length) % props.acA.length,
								);
							} else if (e.key === "Enter") {
								const s = props.acA[props.acActive];
								if (s) {
									e.preventDefault();
									props.selectSurahA(s);
								}
							} else if (e.key === "Escape") {
								props.setAcA([]);
							}
						}}
						placeholder="Ketik nama surah..."
						required
					/>
					{props.acA.length > 0 && (
						<div
							role="listbox"
							id="ziyadah-surah-list"
							className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg"
						>
							{props.acA.map((s, idx) => (
								<button
									key={s.number}
									type="button"
									role="option"
									id={`ziyadah-surah-opt-${s.number}`}
									aria-selected={idx === props.acActive}
									onMouseEnter={() => props.setAcActive(idx)}
									onClick={() => props.selectSurahA(s)}
									className={`flex w-full items-center justify-between px-4 py-2 text-sm first:rounded-t-xl last:rounded-b-xl ${
										idx === props.acActive
											? "bg-muted/70"
											: "hover:bg-muted/50"
									}`}
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
					<label htmlFor="ziyadah-dari-ayat" className="text-sm font-medium">Dari Ayat</label>
					<Input
						id="ziyadah-dari-ayat"
						type="text"
						value={props.dariAyat}
						onChange={(e) => {
							props.setDariAyat(e.target.value);
							props.setDariAyatError("");
						}}
						onBlur={() => {
							const err = validateAyat(props.surahA, props.dariAyat);
							props.setDariAyatError(err ?? "");
						}}
						placeholder="Ayat awal"
						required
					/>
					{props.dariAyatError && (
						<p className="text-xs text-destructive">{props.dariAyatError}</p>
					)}
				</div>
				{!props.lintasMode && (
					<div className="space-y-2">
						<label htmlFor="ziyadah-sampai-ayat" className="text-sm font-medium">Sampai Ayat</label>
						<Input
							id="ziyadah-sampai-ayat"
							type="text"
							value={props.sampaiAyat}
							onChange={(e) => {
								props.setSampaiAyat(e.target.value);
								props.setSampaiAyatError("");
							}}
							onBlur={() => {
								const err = validateAyat(props.surahA, props.sampaiAyat);
								props.setSampaiAyatError(err ?? "");
							}}
							placeholder="Ayat akhir"
							required
						/>
						{props.sampaiAyatError && (
							<p className="text-xs text-destructive">
								{props.sampaiAyatError}
							</p>
						)}
					</div>
				)}
			</div>

			<div className="space-y-2">
				<label htmlFor="ziyadah-juz" className="text-sm font-medium">Juz</label>
				<Input
					id="ziyadah-juz"
					value={props.juz ? `Juz ${props.juz}` : ""}
					readOnly
					placeholder="Juz otomatis dari surah & ayat"
					className="bg-muted/40"
				/>
			</div>

			{props.lintasMode && (
				<div className="rounded-xl bg-muted/30 p-3 border border-dashed border-primary/30">
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="relative space-y-2">
							<label htmlFor="ziyadah-lintas-end" className="text-sm font-medium text-primary">
								Surah Akhir
							</label>
							<Input
								id="ziyadah-lintas-end"
								type="text"
								role="combobox"
								aria-expanded={props.lintasAcEnd.length > 0}
								aria-controls="ziyadah-lintas-end-list"
								aria-activedescendant={
									props.lintasAcEnd.length > 0 && props.acEndActive >= 0
										? `ziyadah-lintas-end-opt-${props.lintasAcEnd[props.acEndActive]?.number}`
										: undefined
								}
								value={props.lintasSurahEnd}
								onChange={(e) =>
									props.handleLintasSurahEndChange(e.target.value)
								}
								onKeyDown={(e) => {
									if (props.lintasAcEnd.length === 0) return;
									if (e.key === "ArrowDown") {
										e.preventDefault();
										props.setAcEndActive(
											(props.acEndActive + 1) % props.lintasAcEnd.length,
										);
									} else if (e.key === "ArrowUp") {
										e.preventDefault();
										props.setAcEndActive(
											(props.acEndActive - 1 + props.lintasAcEnd.length) %
												props.lintasAcEnd.length,
										);
									} else if (e.key === "Enter") {
										const s = props.lintasAcEnd[props.acEndActive];
										if (s) {
											e.preventDefault();
											props.selectLintasSurahEnd(s);
										}
									} else if (e.key === "Escape") {
										props.setLintasAcEnd([]);
									}
								}}
								placeholder="Surah tujuan..."
								required
							/>
							{props.lintasAcEnd.length > 0 && (
								<div
									role="listbox"
									id="ziyadah-lintas-end-list"
									className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg"
								>
									{props.lintasAcEnd.map((s, idx) => (
										<button
											key={s.number}
											type="button"
											role="option"
											id={`ziyadah-lintas-end-opt-${s.number}`}
											aria-selected={idx === props.acEndActive}
											onMouseEnter={() => props.setAcEndActive(idx)}
											onClick={() => props.selectLintasSurahEnd(s)}
											className={`flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl ${
												idx === props.acEndActive
													? "bg-muted/70"
													: "hover:bg-muted/50"
											}`}
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
							<label htmlFor="ziyadah-lintas-sampai" className="text-sm font-medium text-primary">
								Sampai Ayat
							</label>
							<Input
								id="ziyadah-lintas-sampai"
								type="text"
								value={props.lintasSampaiAyat}
								onChange={(e) => {
									props.setLintasSampaiAyat(e.target.value);
									props.setLintasSampaiError("");
								}}
								onBlur={() => {
									const err = validateAyat(
										props.lintasSurahEnd,
										props.lintasSampaiAyat,
									);
									props.setLintasSampaiError(err ?? "");
								}}
								placeholder="Ayat akhir surah tujuan"
								required
							/>
							{props.lintasSampaiError && (
								<p className="text-xs text-destructive">
									{props.lintasSampaiError}
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
							? props.setMushafOpen(!props.mushafOpen)
							: props.setMushafMobileOpen(true)
					}
				>
					<HugeiconsIcon icon={BookOpen01Icon} className="w-4 h-4 mr-1.5" />
					{props.mushafOpen ? "Tutup Mushaf" : "Buka Mushaf"}
				</Button>
				<Button
					type="button"
					variant={props.lintasMode ? "default" : "outline"}
					size="sm"
					onClick={() => {
						props.setLintasMode(!props.lintasMode);
						if (props.lintasMode) {
							props.handleLintasSurahEndChange("");
							props.setLintasSampaiAyat("");
							props.setLintasSampaiError("");
						}
					}}
				>
					{props.lintasMode ? "✕ Tutup Lintas" : "Lintas Surah"}
				</Button>
			</div>

			<div className="space-y-2">
				<label id="ziyadah-penilaian-label" className="text-sm font-medium">Penilaian</label>
				<div
					role="group"
					aria-labelledby="ziyadah-penilaian-label"
					className="flex flex-wrap gap-2"
				>
					{GRADES.map((g) => (
						<button
							key={g}
							type="button"
							aria-pressed={props.gred === g}
							onClick={() => props.setGred(g)}
							className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
								props.gred === g
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
				<label htmlFor="ziyadah-catatan" className="text-sm font-medium">Catatan (opsional)</label>
				<textarea
					id="ziyadah-catatan"
					value={props.catatan}
					onChange={(e) => props.setCatatan(e.target.value)}
					placeholder="Catatan tambahan..."
					rows={3}
					className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none md:text-sm"
				/>
			</div>

			<div className="sticky bottom-16 z-10 -mx-1 -mb-1 bg-card px-1 pb-1 pt-3">
				<Button type="submit" disabled={props.loading} className="w-full">
					{props.loading
						? "Menyimpan..."
						: props.lintasMode
							? "Simpan 2 Setoran Lintas"
							: "Simpan Ziyadah"}
				</Button>
			</div>
		</form>
	);
}

function ZiyadahPage() {
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [selectedSiswa, setSelectedSiswa] = useState("");
	const [tanggal, setTanggal] = useState(localDateString());
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
		return Number.parseInt(
			localStorage.getItem("sijil_ziyadah_panel") ?? "40",
			10,
		);
	});

	const [lintasMode, setLintasMode] = useState(false);
	const [acActive, setAcActive] = useState(0);
	const [acEndActive, setAcEndActive] = useState(0);
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
			.then((data: SetoranData[]) => {
				const next = nextPositionFromList(data, "Ziyadah");
				if (next) {
					const s = SURAH_DATA.find((s) => s.number === next.surah);
					if (s) setSurahA(s.name);
					setDariAyat(String(next.ayat));
				}
			})
			.catch(() => {});
	}, [selectedSiswa]);

	function handleSurahAChange(val: string) {
		setSurahA(val);
		setAcActive(0);
		setAcA(val.length >= 1 ? searchSurah(val).slice(0, 5) : []);
	}

	function selectSurahA(s: Surah) {
		setSurahA(s.name);
		setAcA([]);
	}

	function handleLintasSurahEndChange(val: string) {
		setLintasSurahEnd(val);
		setAcEndActive(0);
		setLintasAcEnd(val.length >= 1 ? searchSurah(val).slice(0, 5) : []);
	}

	function selectLintasSurahEnd(s: Surah) {
		setLintasSurahEnd(s.name);
		setLintasAcEnd([]);
	}

	function computeJuz(): string {
		const start = findSurah(surahA);
		if (!start || !dariAyat) return "";
		const startAyat = Number.parseInt(dariAyat, 10);
		if (Number.isNaN(startAyat) || startAyat <= 0) return "";
		const endSurah = lintasMode ? findSurah(lintasSurahEnd) : start;
		if (!endSurah) return "";
		const endAyat = Number.parseInt(
			lintasMode ? lintasSampaiAyat : sampaiAyat,
			10,
		);
		if (Number.isNaN(endAyat) || endAyat <= 0) return "";
		return juzLabel(start.number, startAyat, endSurah.number, endAyat) ?? "";
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
				toast.error("Lengkapi Surah Akhir dan Sampai Ayat");
				return;
			}
			const endSurah = findSurah(lintasSurahEnd);
			if (!endSurah) {
				toast.error("Surah Akhir tidak ditemukan");
				return;
			}
			const lintasSampaiErr = validateAyat(lintasSurahEnd, lintasSampaiAyat);
			if (lintasSampaiErr) {
				setLintasSampaiError(lintasSampaiErr);
				return;
			}

			setLoading(true);
			const surahAData = findSurah(surahA);

			const res = await fetch("/api/setoran", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					siswaId: selectedSiswa,
					type: "Ziyadah",
					tanggal,
					surah: surahAData?.number ?? 0,
					surahAkhir: endSurah.number,
					lintas: true,
					ayatAwal: Number.parseInt(dariAyat, 10) || 1,
					ayatAkhir: Number.parseInt(lintasSampaiAyat, 10) || 0,
					status: gred,
					catatan,
				}),
			});

			setLoading(false);

			if (res.ok) {
				toast.success("Ziyadah lintas surah tersimpan!");
				resetForm();
				prefillNextFrom({
					type: "Ziyadah",
					surah: 0,
					surahAkhir: endSurah.number,
					lintas: true,
					ayatAwal: 1,
					ayatAkhir: Number.parseInt(lintasSampaiAyat, 10) || 0,
				});
			} else {
				toast.error("Gagal menyimpan");
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
				prefillNextFrom({
					type: "Ziyadah",
					surah: findSurah(surahA)?.number ?? 0,
					lintas: false,
					ayatAwal: Number.parseInt(dariAyat, 10) || 0,
					ayatAkhir:
						Number.parseInt(sampaiAyat, 10) ||
						Number.parseInt(dariAyat, 10) ||
						0,
				});
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

	function prefillNextFrom(saved: SetoranData) {
		const next = nextAfter(saved);
		if (!next) return;
		const s = SURAH_DATA.find((s) => s.number === next.surah);
		setSurahA(s?.name ?? "");
		setDariAyat(String(next.ayat));
	}

	function handleMushafSelect(
		surah: string,
		ayatAwal: number,
		ayatAkhir: number,
		endSurah?: string,
		endAyat?: number,
	) {
		setSurahA(surah);
		setDariAyat(String(ayatAwal));
		if (endSurah) {
			setLintasMode(true);
			setLintasSurahEnd(endSurah);
			if (endAyat) setLintasSampaiAyat(String(endAyat));
		} else {
			setSampaiAyat(String(ayatAkhir));
		}
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

	const formProps = {
		siswaList,
		selectedSiswa,
		setSelectedSiswa,
		tanggal,
		setTanggal,
		surahA,
		handleSurahAChange,
		acA,
		selectSurahA,
		dariAyat,
		setDariAyat,
		dariAyatError,
		setDariAyatError,
		sampaiAyat,
		setSampaiAyat,
		sampaiAyatError,
		setSampaiAyatError,
		lintasMode,
		setLintasMode,
		lintasSurahEnd,
		handleLintasSurahEndChange,
		lintasAcEnd,
		selectLintasSurahEnd,
		lintasSampaiAyat,
		setLintasSampaiAyat,
		lintasSampaiError,
		setLintasSampaiError,
		gred,
		setGred,
		catatan,
		setCatatan,
		loading,
		handleSubmit,
		mushafOpen,
		setMushafOpen,
		setMushafMobileOpen,
		juz: computeJuz(),
		acActive,
		setAcActive,
		acEndActive,
		setAcEndActive,
		setAcA,
		setLintasAcEnd,
	};
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
					style={{ height: "auto", overflow: "visible" }}
					onLayout={savePanelSize}
				>
					<ResizablePanel defaultSize={100 - panelSize} minSize={30}>
						<FormBody {...formProps} />
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
				<FormBody {...formProps} />
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
}
