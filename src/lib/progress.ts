import { findSurah, getJuzForAyat, SURAH_DATA } from "./surah-data";

interface SiswaData {
	nama: string;
	hafalan: number;
	target: number;
	mulaiHafalan?: string | null;
	metodeProgress?: string;
}

export interface SetoranData {
	type: string;
	surah: number;
	surahAkhir?: number | null;
	lintas?: boolean;
	ayatAwal: number;
	ayatAkhir: number;
	juz?: string | null;
}

interface ProgressResult {
	current: number;
	target: number;
	pct: number;
	unit: string;
	noTarget: boolean;
	targetName: string | null;
}

export function hitungJuz(
	surahName: string,
	ayatRange?: string,
): { start: number; end: number } | null {
	const surah = findSurah(surahName);
	if (!surah) return null;

	if (!ayatRange) return { start: surah.juzStart, end: surah.juzEnd };

	const numbers = ayatRange.match(/\d+/g);
	if (!numbers) return { start: surah.juzStart, end: surah.juzEnd };

	const mn = Math.min(...numbers.map(Number));
	const mx = Math.max(...numbers.map(Number));

	return {
		start: getJuzForAyat(surah.number, mn),
		end: getJuzForAyat(surah.number, mx),
	};
}

export function calcProgress(
	siswa: SiswaData,
	setoranList: SetoranData[],
): ProgressResult {
	const m = siswa.metodeProgress || "juz";
	let cur = 0;
	let tgt = siswa.target || 0;
	let unit = "Juz";
	let targetName: string | null = null;

	const ziyadahRecords = setoranList.filter((r) => r.type === "Ziyadah");

	if (m === "juz") {
		const jSet = new Set<number>();
		ziyadahRecords.forEach((r) => {
			if (r.juz) {
				const pts = String(r.juz)
					.split("-")
					.map(Number)
					.filter((n) => !Number.isNaN(n));
				if (pts.length === 2) {
					for (let j = pts[0]; j <= pts[1]; j++) jSet.add(j);
				} else if (pts.length === 1) {
					jSet.add(pts[0]);
				}
			} else if (r.surah) {
				const surah = SURAH_DATA.find((s) => s.number === r.surah);
				if (surah) {
					const juzResult = hitungJuz(
						surah.name,
						`${r.ayatAwal}-${r.ayatAkhir}`,
					);
					if (juzResult) {
						if (juzResult.start === juzResult.end) {
							jSet.add(juzResult.start);
						} else {
							for (let j = juzResult.start; j <= juzResult.end; j++)
								jSet.add(j);
						}
					}
				}
			}
		});

		const idxMulai = Number.parseInt(siswa.mulaiHafalan || "", 10);
		const idxTarget = siswa.target;

		if (!Number.isNaN(idxMulai) && idxTarget) {
			tgt = Math.abs(idxMulai - idxTarget) + 1;
			const baseCur = siswa.hafalan || 0;
			cur = baseCur + jSet.size;
			unit = "Juz";
			targetName = `Juz ${idxTarget}`;
		} else {
			cur = (siswa.hafalan || 0) + jSet.size;
			tgt = siswa.target || 0;
		}
	} else if (m === "surah") {
		const sSet = new Set<string>();
		ziyadahRecords.forEach((r) => {
			if (r.lintas && r.surahAkhir) {
				for (let sn = r.surah; sn <= r.surahAkhir; sn++) {
					const sData = SURAH_DATA.find((s) => s.number === sn);
					if (sData) sSet.add(sData.name);
				}
			} else {
				const surah = SURAH_DATA.find((s) => s.number === r.surah);
				if (surah) sSet.add(surah.name);
			}
		});

		const idxMulai = siswa.mulaiHafalan
			? SURAH_DATA.findIndex(
					(s) =>
						s.name.toLowerCase() === (siswa.mulaiHafalan || "").toLowerCase(),
				)
			: -1;
		const idxTarget = siswa.target;
		const idxTargetSurah = idxTarget > 0 ? SURAH_DATA[idxTarget - 1] : null;

		if (idxMulai !== -1 && idxTargetSurah) {
			const idxTargetIdx = SURAH_DATA.findIndex(
				(s) => s.name === idxTargetSurah.name,
			);
			tgt = Math.abs(idxMulai - idxTargetIdx) + 1;
			cur = sSet.size;
			unit = "Surah";
			targetName = idxTargetSurah.name;
		} else {
			cur = sSet.size;
			tgt = 0;
			unit = "Surah";
		}
	}

	if (!tgt || tgt === 0) {
		return {
			current: cur,
			target: 0,
			pct: 0,
			unit,
			noTarget: true,
			targetName: null,
		};
	}

	const pct = Math.min(100, Math.round((cur / tgt) * 100));
	return { current: cur, target: tgt, pct, unit, noTarget: false, targetName };
}

export function getSurahName(surahNumber: number): string {
	return (
		SURAH_DATA.find((s) => s.number === surahNumber)?.name || `#${surahNumber}`
	);
}

export interface NextPosition {
	surah: number;
	ayat: number;
}

export function nextAfter(setoran: SetoranData): NextPosition | null {
	const endSurah = setoran.lintas && setoran.surahAkhir
		? setoran.surahAkhir
		: setoran.surah;
	const endAyat = setoran.ayatAkhir || setoran.ayatAwal;
	const surah = SURAH_DATA.find((s) => s.number === endSurah);
	if (!surah) return null;
	if (endAyat < surah.ayatCount) return { surah: endSurah, ayat: endAyat + 1 };
	const next = SURAH_DATA.find((s) => s.number === endSurah + 1);
	if (!next) return null;
	return { surah: next.number, ayat: 1 };
}

// ponytail: API sorts setoran by tanggal ASC, so scanning from the end returns the newest match
export function lastOfType(
	setorans: SetoranData[],
	type: "Ziyadah" | "Murajaah",
): SetoranData | null {
	for (let i = setorans.length - 1; i >= 0; i--) {
		const r = setorans[i];
		if (type === "Ziyadah" ? r.type === "Ziyadah" : r.type.startsWith("Murajaah")) {
			return r;
		}
	}
	return null;
}

export function nextPositionFromList(
	setorans: SetoranData[],
	type: "Ziyadah" | "Murajaah",
): NextPosition | null {
	const last = lastOfType(setorans, type);
	return last ? nextAfter(last) : null;
}
