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

interface FormBodyProps {
	siswaList: Siswa[];
	selectedSiswa: string;
	setSelectedSiswa: (v: string) => void;
	selectedSiswaData: Siswa | undefined;
	tanggal: string;
	setTanggal: (v: string) => void;
	jenis: string;
	setJenis: (v: string) => void;
	surahA: string;
	handleSurahAChange: (v: string) => void;
	acA: Surah[];
	setSurahA: (v: string) => void;
	setAcA: (v: Surah[]) => void;
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
}

function FormBody(props: FormBodyProps) {
	return (
		<form
			onSubmit={props.handleSubmit}
			className="rounded-2xl border bg-card p-4 shadow-xs space-y-4"
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium">Siswa</label>
					<select
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
					<label className="text-sm font-medium">Tanggal</label>
					<Input
						type="date"
						value={props.tanggal}
						onChange={(e) => props.setTanggal(e.target.value)}
						required
					/>
				</div>
			</div>

			{props.selectedSiswaData && (
				<div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-2.5">
					<div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
						<span className="text-sm font-bold">
							{props.selectedSiswaData.nama.charAt(0)}
						</span>
					</div>
					<div>
						<p className="text-sm font-semibold">
							{props.selectedSiswaData.nama}
						</p>
						<p className="text-xs text-muted-foreground">
							{props.selectedSiswaData.hafalan} juz terhafal
						</p>
					</div>
				</div>
			)}

			<div className="space-y-2">
				<label className="text-sm font-medium">Jenis</label>
				<div className="flex flex-wrap gap-2">
					{JENIS_MURAJAAH.map((j) => (
						<button
							key={j}
							type="button"
							onClick={() => props.setJenis(j)}
							className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
								props.jenis === j
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							}`}
						>
							{j}
						</button>
					))}
				</div>
			</div>

			<div
				className={`grid gap-3 ${props.lintasMode ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
			>
				<div className="relative space-y-2">
					<label className="text-sm font-medium">Surah</label>
					<Input
						type="text"
						value={props.surahA}
						onChange={(e) => props.handleSurahAChange(e.target.value)}
						placeholder="Ketik nama surah..."
						required
					/>
					{props.acA.length > 0 && (
						<div className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg">
							{props.acA.map((s) => (
								<button
									key={s.number}
									type="button"
									onClick={() => {
										props.setSurahA(s.name);
										props.setAcA([]);
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
						<label className="text-sm font-medium">Sampai Ayat</label>
						<Input
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

			{props.lintasMode && (
				<div className="rounded-xl bg-muted/30 p-3 border border-dashed border-primary/30">
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="relative space-y-2">
							<label className="text-sm font-medium text-primary">
								Surah Akhir
							</label>
							<Input
								type="text"
								value={props.lintasSurahEnd}
								onChange={(e) =>
									props.handleLintasSurahEndChange(e.target.value)
								}
								placeholder="Surah tujuan..."
								required
							/>
							{props.lintasAcEnd.length > 0 && (
								<div className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg">
									{props.lintasAcEnd.map((s) => (
										<button
											key={s.number}
											type="button"
											onClick={() => props.selectLintasSurahEnd(s)}
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
				<label className="text-sm font-medium">Penilaian</label>
				<div className="flex flex-wrap gap-2">
					{GRADES.map((g) => (
						<button
							key={g}
							type="button"
							onClick={() => props.setGred(g)}
							className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
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
				<label className="text-sm font-medium">Catatan (opsional)</label>
				<textarea
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
							: "Simpan Murajaah"}
				</Button>
			</div>
		</form>
	);
}

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

	const [panelSize, setPanelSize] = useState(() => {
		if (typeof window === "undefined") return 40;
		return Number.parseInt(
			localStorage.getItem("sijil_murajaah_panel") ?? "40",
			10,
		);
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
				(
					data: {
						surah?: number;
						surahAkhir?: number;
						lintas?: boolean;
						ayatAwal?: number;
						ayatAkhir?: number;
					}[],
				) => {
					if (data.length > 0) {
						const last = data[data.length - 1];
						if (last.lintas && last.surahAkhir) {
							const endSurah = SURAH_DATA.find(
								(s) => s.number === last.surahAkhir,
							);
							if (endSurah && last.ayatAkhir != null) {
								if (last.ayatAkhir >= endSurah.ayatCount) {
									const nextSurahNum = last.surahAkhir + 1;
									const next = SURAH_DATA.find(
										(s) => s.number === nextSurahNum,
									);
									if (next) {
										setSurahA(next.name);
										setDariAyat("1");
									}
								} else {
									setSurahA(endSurah.name);
									setDariAyat(String(last.ayatAkhir + 1));
								}
							}
						} else {
							if (last.surah) {
								const s = SURAH_DATA.find((s) => s.number === last.surah);
								if (s) setSurahA(s.name);
							}
							if (last.ayatAkhir) setDariAyat(String(last.ayatAkhir + 1));
						}
					}
				},
			)
			.catch(() => {});
	}, [selectedSiswa]);

	function handleSurahAChange(val: string) {
		setSurahA(val);
		setAcA(val.length >= 1 ? searchSurah(val).slice(0, 5) : []);
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
					type: jenis,
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
				toast.success("Murajaah lintas surah tersimpan!");
				resetForm();
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
					type: jenis,
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
				toast.success("Murajaah tersimpan!");
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
			localStorage.setItem("sijil_murajaah_panel", String(Math.round(right)));
		}
	}

	const selectedSiswaData = siswaList.find((s) => s.id === selectedSiswa);

	const formProps = {
		siswaList,
		selectedSiswa,
		setSelectedSiswa,
		selectedSiswaData,
		tanggal,
		setTanggal,
		jenis,
		setJenis,
		surahA,
		handleSurahAChange,
		acA,
		setSurahA,
		setAcA,
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
	};

	return (
		<div className="mx-auto max-w-7xl space-y-4 pb-20 md:pb-6">
			<div>
				<h2 className="text-base font-semibold">Murajaah — Review Hafalan</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Catat murajaah dan review hafalan siswa
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
