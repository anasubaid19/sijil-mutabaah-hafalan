import { SURAH_DATA, findSurah } from "./surah-data";

interface SiswaData {
	nama: string;
	hafalan: number;
	target: number;
	mulaiHafalan?: string | null;
	metodeProgress?: string;
}

interface SetoranData {
	type: string;
	surah: number;
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

	// Surahs that span multiple juz — need ayat-level calculation
	if (surahName === "Al-Baqarah") {
		const s = mn <= 141 ? 1 : mn <= 252 ? 2 : 3;
		const e = mx <= 141 ? 1 : mx <= 252 ? 2 : 3;
		return { start: s, end: e };
	}
	if (surahName === "Ali 'Imran") {
		const s = mn <= 92 ? 3 : 4;
		const e = mx <= 92 ? 3 : 4;
		return { start: s, end: e };
	}
	if (surahName === "An-Nisa'") {
		const s = mn <= 23 ? 4 : mn <= 147 ? 5 : 6;
		const e = mx <= 23 ? 4 : mx <= 147 ? 5 : 6;
		return { start: s, end: e };
	}
	if (surahName === "Al-Ma'idah") {
		const s = mn <= 81 ? 6 : 7;
		const e = mx <= 81 ? 6 : 7;
		return { start: s, end: e };
	}
	if (surahName === "Al-An'am") {
		const s = mn <= 110 ? 7 : 8;
		const e = mx <= 110 ? 7 : 8;
		return { start: s, end: e };
	}
	if (surahName === "Al-A'raf") {
		const s = mn <= 87 ? 8 : 9;
		const e = mx <= 87 ? 8 : 9;
		return { start: s, end: e };
	}
	if (surahName === "Al-Anfal") {
		const s = mn <= 40 ? 9 : 10;
		const e = mx <= 40 ? 9 : 10;
		return { start: s, end: e };
	}
	if (surahName === "At-Taubah") {
		const s = mn <= 92 ? 10 : 11;
		const e = mx <= 92 ? 10 : 11;
		return { start: s, end: e };
	}

	return { start: surah.juzStart, end: surah.juzEnd };
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
			const surah = SURAH_DATA.find((s) => s.number === r.surah);
			if (surah) sSet.add(surah.name);
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
