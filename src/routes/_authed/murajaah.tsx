import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GradeSelector } from "@/components/grade-selector";
import { MushafPanel } from "@/components/mushaf-panel";
import { showSubmissionSuccess } from "@/components/submission-success-toast";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
	calcProgress,
	nextPositionFromList,
	nextAfter,
	type SetoranData,
} from "@/lib/progress";
import { localDateString } from "@/lib/utils";

interface Siswa {
	id: string;
	nama: string;
	hafalan: number;
	target: number;
}

const JENIS_MURAJAAH = [
	"Murajaah Fardi",
	"Murajaah Bersama",
	"Sabqi",
	"Muraja'ah",
];
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
	onCancel: () => void;
	mushafOpen: boolean;
	setMushafOpen: (v: boolean) => void;
	setMushafMobileOpen: (v: boolean) => void;
	juz: string;
	terhafal: string;
	acActive: number;
	setAcActive: (v: number) => void;
	acEndActive: number;
	setAcEndActive: (v: number) => void;
	setLintasAcEnd: (v: Surah[]) => void;
}

function FormBody(props: FormBodyProps) {
	return (
		<form
			onSubmit={props.handleSubmit}
			className="w-full max-w-3xl space-y-4 rounded-2xl border bg-card p-4 shadow-xs"
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-2">
					<label htmlFor="murajaah-siswa" className="text-sm font-medium">Siswa</label>
					<select
						id="murajaah-siswa"
						value={props.selectedSiswa}
						onChange={(e) => props.setSelectedSiswa(e.target.value)}
						required
					className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-base shadow-xs transition-[border-color,box-shadow] hover:border-foreground/25 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20 md:text-sm"
					>
					<option value="">Pilih siswa…</option>
						{props.siswaList.map((s) => (
							<option key={s.id} value={s.id}>
								{s.nama}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-2">
					<label htmlFor="murajaah-tanggal" className="text-sm font-medium">Tanggal</label>
					<Input
						id="murajaah-tanggal"
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
							{props.terhafal}
						</p>
					</div>
				</div>
			)}

			<div className="space-y-2">
				<label id="murajaah-jenis-label" className="text-sm font-medium">Jenis</label>
				<div
					role="group"
					aria-labelledby="murajaah-jenis-label"
					className="flex flex-wrap gap-2"
				>
					{JENIS_MURAJAAH.map((j) => (
						<button
							key={j}
							type="button"
							aria-pressed={props.jenis === j}
							onClick={() => props.setJenis(j)}
							className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
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
					<label htmlFor="murajaah-surah-a" className="text-sm font-medium">Surah</label>
					<Input
						id="murajaah-surah-a"
						type="text"
						role="combobox"
						aria-expanded={props.acA.length > 0}
						aria-controls="murajaah-surah-list"
						aria-activedescendant={
							props.acA.length > 0 && props.acActive >= 0
								? `murajaah-surah-opt-${props.acA[props.acActive]?.number}`
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
									props.setSurahA(s.name);
									props.setAcA([]);
								}
							} else if (e.key === "Escape") {
								props.setAcA([]);
							}
						}}
						placeholder="Ketik nama surah…"
						required
					/>
					{props.acA.length > 0 && (
						<div
							role="listbox"
							id="murajaah-surah-list"
							className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg"
						>
							{props.acA.map((s, idx) => (
								<button
									key={s.number}
									type="button"
									role="option"
									id={`murajaah-surah-opt-${s.number}`}
									aria-selected={idx === props.acActive}
									onMouseEnter={() => props.setAcActive(idx)}
									onClick={() => {
										props.setSurahA(s.name);
										props.setAcA([]);
									}}
									className={`flex w-full items-center justify-between px-4 py-2 text-sm first:rounded-t-xl last:rounded-b-xl ${
										idx === props.acActive ? "bg-muted/70" : "hover:bg-muted/50"
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
					<label htmlFor="murajaah-dari-ayat" className="text-sm font-medium">Dari Ayat</label>
					<Input
						id="murajaah-dari-ayat"
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
						<label htmlFor="murajaah-sampai-ayat" className="text-sm font-medium">Sampai Ayat</label>
						<Input
							id="murajaah-sampai-ayat"
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
				<label htmlFor="murajaah-juz" className="text-sm font-medium">Juz</label>
				<Input
					id="murajaah-juz"
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
							<label htmlFor="murajaah-lintas-end" className="text-sm font-medium text-primary">
								Surah Akhir
							</label>
							<Input
								id="murajaah-lintas-end"
								type="text"
								role="combobox"
								aria-expanded={props.lintasAcEnd.length > 0}
								aria-controls="murajaah-lintas-end-list"
								aria-activedescendant={
									props.lintasAcEnd.length > 0 && props.acEndActive >= 0
										? `murajaah-lintas-end-opt-${props.lintasAcEnd[props.acEndActive]?.number}`
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
								placeholder="Surah tujuan…"
								required
							/>
							{props.lintasAcEnd.length > 0 && (
								<div
									role="listbox"
									id="murajaah-lintas-end-list"
									className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg"
								>
									{props.lintasAcEnd.map((s, idx) => (
										<button
											key={s.number}
											type="button"
											role="option"
											id={`murajaah-lintas-end-opt-${s.number}`}
											aria-selected={idx === props.acEndActive}
											onMouseEnter={() => props.setAcEndActive(idx)}
											onClick={() => props.selectLintasSurahEnd(s)}
											className={`flex w-full items-center justify-between px-4 py-2 text-sm first:rounded-t-xl last:rounded-b-xl ${
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
							<label htmlFor="murajaah-lintas-end-ayat" className="text-sm font-medium text-primary">
								Sampai Ayat
							</label>
							<Input
								id="murajaah-lintas-end-ayat"
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

			<GradeSelector id="murajaah-penilaian" value={props.gred} onChange={props.setGred} />

			<div className="space-y-2">
				<label htmlFor="murajaah-catatan" className="text-sm font-medium">Catatan (opsional)</label>
				<Textarea
					id="murajaah-catatan"
					value={props.catatan}
					onChange={(e) => props.setCatatan(e.target.value)}
					placeholder="Catatan tambahan…"
					rows={3}
				/>
			</div>

			<div className="sticky bottom-16 z-10 -mx-1 -mb-1 flex flex-col gap-2 border-t bg-card/95 px-1 pb-1 pt-3 backdrop-blur-sm sm:static sm:mx-0 sm:mb-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none">
				<Button
					type="button"
					variant="ghost"
					onClick={props.onCancel}
					disabled={props.loading}
					className="w-full sm:w-auto"
				>
					Batal
				</Button>
				<Button
					type="submit"
					name="submitAction"
					value="next-student"
					variant="outline"
					disabled={props.loading}
					className="w-full sm:w-auto"
				>
					Simpan & Siswa Berikutnya
				</Button>
				<Button type="submit" disabled={props.loading} className="w-full sm:w-auto">
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
	const navigate = useNavigate();
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [selectedSiswa, setSelectedSiswa] = useState("");
	const [tanggal, setTanggal] = useState(localDateString());
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
	const [setoranList, setSetoranList] = useState<SetoranData[]>([]);
	const [acActive, setAcActive] = useState(0);
	const [acEndActive, setAcEndActive] = useState(0);

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
		if (!selectedSiswa) {
			setSetoranList([]);
			return;
		}
		fetch(`/api/setoran?siswaId=${selectedSiswa}`)
			.then((r) => {
				if (r.ok) return r.json();
				throw new Error();
			})
			.then((data: SetoranData[]) => {
				setSetoranList(data);
				const next = nextPositionFromList(data, "Murajaah");
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
		const submitter = (e.nativeEvent as SubmitEvent).submitter as
			| HTMLButtonElement
			| null;
		const advanceStudent = submitter?.value === "next-student";
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
				completeSave({
					type: jenis,
					surah: 0,
					surahAkhir: endSurah.number,
					lintas: true,
					ayatAwal: 1,
					ayatAkhir: Number.parseInt(lintasSampaiAyat, 10) || 0,
				}, advanceStudent);
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
				completeSave({
					type: jenis,
					surah: findSurah(surahA)?.number ?? 0,
					lintas: false,
					ayatAwal: Number.parseInt(dariAyat, 10) || 0,
					ayatAkhir:
						Number.parseInt(sampaiAyat, 10) ||
						Number.parseInt(dariAyat, 10) ||
						0,
				}, advanceStudent);
			} else {
				toast.error("Gagal menyimpan");
			}
		}
	}

	function completeSave(saved: SetoranData, advanceStudent: boolean) {
		const savedStudentId = selectedSiswa;
		const savedStudentName =
			siswaList.find((student) => student.id === savedStudentId)?.nama ?? "siswa";

		resetForm();
		if (advanceStudent && siswaList.length > 1) {
			const currentIndex = siswaList.findIndex(
				(student) => student.id === savedStudentId,
			);
			const nextStudent = siswaList[(currentIndex + 1) % siswaList.length];
			if (nextStudent) setSelectedSiswa(nextStudent.id);
		} else {
			prefillNextFrom(saved);
		}

		showSubmissionSuccess({
			studentName: savedStudentName,
			onNext: () => document.getElementById("murajaah-siswa")?.focus(),
			onMurajaah: () => document.getElementById("murajaah-siswa")?.focus(),
			onReport: () =>
				navigate({ to: "/laporan", search: { siswa: savedStudentId } }),
		});
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

	function savePanelSize(sizes: Record<string, number>) {
		const right = sizes.mushaf;
		if (right !== undefined) {
			setPanelSize(right);
			localStorage.setItem("sijil_murajaah_panel", String(Math.round(right)));
		}
	}

	const selectedSiswaData = siswaList.find((s) => s.id === selectedSiswa);

	const prog = selectedSiswaData
		? calcProgress(selectedSiswaData, setoranList)
		: null;

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
		onCancel: resetForm,
		mushafOpen,
		setMushafOpen,
		setMushafMobileOpen,
		juz: computeJuz(),
		terhafal: prog
			? `${prog.current} ${prog.unit.toLowerCase()} terhafal`
			: "",
		acActive,
		setAcActive,
		acEndActive,
		setAcEndActive,
		setLintasAcEnd,
	};

	return (
		<div className="mx-auto max-w-6xl space-y-4 pb-20 md:pb-6">
			<div>
				<h2 className="text-base font-semibold">Murajaah — Review Hafalan</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Catat murajaah dan review hafalan siswa
				</p>
			</div>

			<div className="hidden lg:block">
				<ResizablePanelGroup
					orientation="horizontal"
					className="gap-3"
					style={{ height: "auto", overflow: "visible" }}
					onLayoutChanged={savePanelSize}
				>
					<ResizablePanel id="form" defaultSize={100 - panelSize} minSize="30%">
						<FormBody {...formProps} />
					</ResizablePanel>
					{mushafOpen && (
						<>
							<ResizableHandle withHandle />
							<ResizablePanel id="mushaf" defaultSize={panelSize} minSize="25%">
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
