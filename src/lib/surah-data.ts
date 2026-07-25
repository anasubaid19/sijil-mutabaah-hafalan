export interface Surah {
	number: number;
	name: string;
	ayatCount: number;
	juzStart: number;
	juzEnd: number;
}

// ponytail: data extracted from original index.html SURAH_DATA
export const SURAH_DATA: Surah[] = [
	{ number: 1, name: "Al-Fatihah", ayatCount: 7, juzStart: 1, juzEnd: 1 },
	{ number: 2, name: "Al-Baqarah", ayatCount: 286, juzStart: 1, juzEnd: 3 },
	{ number: 3, name: "Ali 'Imran", ayatCount: 200, juzStart: 3, juzEnd: 4 },
	{ number: 4, name: "An-Nisa'", ayatCount: 176, juzStart: 4, juzEnd: 6 },
	{ number: 5, name: "Al-Ma'idah", ayatCount: 120, juzStart: 6, juzEnd: 7 },
	{ number: 6, name: "Al-An'am", ayatCount: 165, juzStart: 7, juzEnd: 8 },
	{ number: 7, name: "Al-A'raf", ayatCount: 206, juzStart: 8, juzEnd: 9 },
	{ number: 8, name: "Al-Anfal", ayatCount: 75, juzStart: 9, juzEnd: 10 },
	{ number: 9, name: "At-Taubah", ayatCount: 129, juzStart: 10, juzEnd: 11 },
	{ number: 10, name: "Yunus", ayatCount: 109, juzStart: 11, juzEnd: 11 },
	{ number: 11, name: "Hud", ayatCount: 123, juzStart: 11, juzEnd: 12 },
	{ number: 12, name: "Yusuf", ayatCount: 111, juzStart: 12, juzEnd: 13 },
	{ number: 13, name: "Ar-Ra'd", ayatCount: 43, juzStart: 13, juzEnd: 13 },
	{ number: 14, name: "Ibrahim", ayatCount: 52, juzStart: 13, juzEnd: 13 },
	{ number: 15, name: "Al-Hijr", ayatCount: 99, juzStart: 14, juzEnd: 14 },
	{ number: 16, name: "An-Nahl", ayatCount: 128, juzStart: 14, juzEnd: 14 },
	{ number: 17, name: "Al-Isra'", ayatCount: 111, juzStart: 15, juzEnd: 15 },
	{ number: 18, name: "Al-Kahf", ayatCount: 110, juzStart: 15, juzEnd: 16 },
	{ number: 19, name: "Maryam", ayatCount: 98, juzStart: 16, juzEnd: 16 },
	{ number: 20, name: "Ta Ha", ayatCount: 135, juzStart: 16, juzEnd: 16 },
	{ number: 21, name: "Al-Anbiya'", ayatCount: 112, juzStart: 17, juzEnd: 17 },
	{ number: 22, name: "Al-Hajj", ayatCount: 78, juzStart: 17, juzEnd: 17 },
	{ number: 23, name: "Al-Mu'minun", ayatCount: 118, juzStart: 18, juzEnd: 18 },
	{ number: 24, name: "An-Nur", ayatCount: 64, juzStart: 18, juzEnd: 18 },
	{ number: 25, name: "Al-Furqan", ayatCount: 77, juzStart: 18, juzEnd: 19 },
	{
		number: 26,
		name: "Asy-Syu'ara'",
		ayatCount: 227,
		juzStart: 19,
		juzEnd: 19,
	},
	{ number: 27, name: "An-Naml", ayatCount: 93, juzStart: 19, juzEnd: 20 },
	{ number: 28, name: "Al-Qasas", ayatCount: 88, juzStart: 20, juzEnd: 20 },
	{ number: 29, name: "Al-'Ankabut", ayatCount: 69, juzStart: 20, juzEnd: 21 },
	{ number: 30, name: "Ar-Rum", ayatCount: 60, juzStart: 21, juzEnd: 21 },
	{ number: 31, name: "Luqman", ayatCount: 34, juzStart: 21, juzEnd: 21 },
	{ number: 32, name: "As-Sajdah", ayatCount: 30, juzStart: 21, juzEnd: 21 },
	{ number: 33, name: "Al-Ahzab", ayatCount: 73, juzStart: 21, juzEnd: 22 },
	{ number: 34, name: "Saba'", ayatCount: 54, juzStart: 22, juzEnd: 22 },
	{ number: 35, name: "Fatir", ayatCount: 45, juzStart: 22, juzEnd: 22 },
	{ number: 36, name: "Ya Sin", ayatCount: 83, juzStart: 22, juzEnd: 23 },
	{ number: 37, name: "As-Saffat", ayatCount: 182, juzStart: 23, juzEnd: 23 },
	{ number: 38, name: "Sad", ayatCount: 88, juzStart: 23, juzEnd: 23 },
	{ number: 39, name: "Az-Zumar", ayatCount: 75, juzStart: 23, juzEnd: 24 },
	{ number: 40, name: "Ghafir", ayatCount: 85, juzStart: 24, juzEnd: 24 },
	{ number: 41, name: "Fussilat", ayatCount: 54, juzStart: 24, juzEnd: 25 },
	{ number: 42, name: "Asy-Syura", ayatCount: 53, juzStart: 25, juzEnd: 25 },
	{ number: 43, name: "Az-Zukhruf", ayatCount: 89, juzStart: 25, juzEnd: 25 },
	{ number: 44, name: "Ad-Dukhan", ayatCount: 59, juzStart: 25, juzEnd: 25 },
	{ number: 45, name: "Al-Jasiyah", ayatCount: 37, juzStart: 25, juzEnd: 25 },
	{ number: 46, name: "Al-Ahqaf", ayatCount: 35, juzStart: 26, juzEnd: 26 },
	{ number: 47, name: "Muhammad", ayatCount: 38, juzStart: 26, juzEnd: 26 },
	{ number: 48, name: "Al-Fath", ayatCount: 29, juzStart: 26, juzEnd: 26 },
	{ number: 49, name: "Al-Hujurat", ayatCount: 18, juzStart: 26, juzEnd: 26 },
	{ number: 50, name: "Qaf", ayatCount: 45, juzStart: 26, juzEnd: 26 },
	{ number: 51, name: "Az-Zariyat", ayatCount: 60, juzStart: 26, juzEnd: 27 },
	{ number: 52, name: "At-Tur", ayatCount: 49, juzStart: 27, juzEnd: 27 },
	{ number: 53, name: "An-Najm", ayatCount: 62, juzStart: 27, juzEnd: 27 },
	{ number: 54, name: "Al-Qamar", ayatCount: 55, juzStart: 27, juzEnd: 27 },
	{ number: 55, name: "Ar-Rahman", ayatCount: 78, juzStart: 27, juzEnd: 27 },
	{ number: 56, name: "Al-Waqi'ah", ayatCount: 96, juzStart: 27, juzEnd: 27 },
	{ number: 57, name: "Al-Hadid", ayatCount: 29, juzStart: 27, juzEnd: 27 },
	{ number: 58, name: "Al-Mujadilah", ayatCount: 22, juzStart: 28, juzEnd: 28 },
	{ number: 59, name: "Al-Hasyr", ayatCount: 24, juzStart: 28, juzEnd: 28 },
	{
		number: 60,
		name: "Al-Mumtahanah",
		ayatCount: 13,
		juzStart: 28,
		juzEnd: 28,
	},
	{ number: 61, name: "As-Saff", ayatCount: 14, juzStart: 28, juzEnd: 28 },
	{ number: 62, name: "Al-Jumu'ah", ayatCount: 11, juzStart: 28, juzEnd: 28 },
	{ number: 63, name: "Al-Munafiqun", ayatCount: 11, juzStart: 28, juzEnd: 28 },
	{ number: 64, name: "At-Tagabun", ayatCount: 18, juzStart: 28, juzEnd: 28 },
	{ number: 65, name: "At-Talaq", ayatCount: 12, juzStart: 28, juzEnd: 28 },
	{ number: 66, name: "At-Tahrim", ayatCount: 12, juzStart: 28, juzEnd: 28 },
	{ number: 67, name: "Al-Mulk", ayatCount: 30, juzStart: 29, juzEnd: 29 },
	{ number: 68, name: "Al-Qalam", ayatCount: 52, juzStart: 29, juzEnd: 29 },
	{ number: 69, name: "Al-Haqqah", ayatCount: 52, juzStart: 29, juzEnd: 29 },
	{ number: 70, name: "Al-Ma'arij", ayatCount: 44, juzStart: 29, juzEnd: 29 },
	{ number: 71, name: "Nuh", ayatCount: 28, juzStart: 29, juzEnd: 29 },
	{ number: 72, name: "Al-Jinn", ayatCount: 28, juzStart: 29, juzEnd: 29 },
	{ number: 73, name: "Al-Muzzammil", ayatCount: 20, juzStart: 29, juzEnd: 29 },
	{ number: 74, name: "Al-Muddassir", ayatCount: 56, juzStart: 29, juzEnd: 29 },
	{ number: 75, name: "Al-Qiyamah", ayatCount: 40, juzStart: 29, juzEnd: 29 },
	{ number: 76, name: "Al-Insan", ayatCount: 31, juzStart: 29, juzEnd: 29 },
	{ number: 77, name: "Al-Mursalat", ayatCount: 50, juzStart: 29, juzEnd: 29 },
	{ number: 78, name: "An-Naba'", ayatCount: 40, juzStart: 30, juzEnd: 30 },
	{ number: 79, name: "An-Nazi'at", ayatCount: 46, juzStart: 30, juzEnd: 30 },
	{ number: 80, name: "'Abasa", ayatCount: 42, juzStart: 30, juzEnd: 30 },
	{ number: 81, name: "At-Takwir", ayatCount: 29, juzStart: 30, juzEnd: 30 },
	{ number: 82, name: "Al-Infitar", ayatCount: 19, juzStart: 30, juzEnd: 30 },
	{
		number: 83,
		name: "Al-Mutaffifin",
		ayatCount: 36,
		juzStart: 30,
		juzEnd: 30,
	},
	{ number: 84, name: "Al-Insyiqaq", ayatCount: 25, juzStart: 30, juzEnd: 30 },
	{ number: 85, name: "Al-Buruj", ayatCount: 22, juzStart: 30, juzEnd: 30 },
	{ number: 86, name: "At-Tariq", ayatCount: 17, juzStart: 30, juzEnd: 30 },
	{ number: 87, name: "Al-A'la", ayatCount: 19, juzStart: 30, juzEnd: 30 },
	{ number: 88, name: "Al-Gasyiyah", ayatCount: 26, juzStart: 30, juzEnd: 30 },
	{ number: 89, name: "Al-Fajr", ayatCount: 30, juzStart: 30, juzEnd: 30 },
	{ number: 90, name: "Al-Balad", ayatCount: 20, juzStart: 30, juzEnd: 30 },
	{ number: 91, name: "Asy-Syams", ayatCount: 15, juzStart: 30, juzEnd: 30 },
	{ number: 92, name: "Al-Lail", ayatCount: 21, juzStart: 30, juzEnd: 30 },
	{ number: 93, name: "Ad-Duha", ayatCount: 11, juzStart: 30, juzEnd: 30 },
	{ number: 94, name: "Asy-Syarh", ayatCount: 8, juzStart: 30, juzEnd: 30 },
	{ number: 95, name: "At-Tin", ayatCount: 8, juzStart: 30, juzEnd: 30 },
	{ number: 96, name: "Al-'Alaq", ayatCount: 19, juzStart: 30, juzEnd: 30 },
	{ number: 97, name: "Al-Qadr", ayatCount: 5, juzStart: 30, juzEnd: 30 },
	{ number: 98, name: "Al-Bayyinah", ayatCount: 8, juzStart: 30, juzEnd: 30 },
	{ number: 99, name: "Az-Zalzalah", ayatCount: 8, juzStart: 30, juzEnd: 30 },
	{ number: 100, name: "Al-'Adiyat", ayatCount: 11, juzStart: 30, juzEnd: 30 },
	{ number: 101, name: "Al-Qari'ah", ayatCount: 11, juzStart: 30, juzEnd: 30 },
	{ number: 102, name: "At-Takasur", ayatCount: 8, juzStart: 30, juzEnd: 30 },
	{ number: 103, name: "Al-'Asr", ayatCount: 3, juzStart: 30, juzEnd: 30 },
	{ number: 104, name: "Al-Humazah", ayatCount: 9, juzStart: 30, juzEnd: 30 },
	{ number: 105, name: "Al-Fil", ayatCount: 5, juzStart: 30, juzEnd: 30 },
	{ number: 106, name: "Quraisy", ayatCount: 4, juzStart: 30, juzEnd: 30 },
	{ number: 107, name: "Al-Ma'un", ayatCount: 7, juzStart: 30, juzEnd: 30 },
	{ number: 108, name: "Al-Kausar", ayatCount: 3, juzStart: 30, juzEnd: 30 },
	{ number: 109, name: "Al-Kafirun", ayatCount: 6, juzStart: 30, juzEnd: 30 },
	{ number: 110, name: "An-Nasr", ayatCount: 3, juzStart: 30, juzEnd: 30 },
	{ number: 111, name: "Al-Lahab", ayatCount: 5, juzStart: 30, juzEnd: 30 },
	{ number: 112, name: "Al-Ikhlas", ayatCount: 4, juzStart: 30, juzEnd: 30 },
	{ number: 113, name: "Al-Falaq", ayatCount: 5, juzStart: 30, juzEnd: 30 },
	{ number: 114, name: "An-Nas", ayatCount: 6, juzStart: 30, juzEnd: 30 },
];

export function findSurah(name: string): Surah | undefined {
	return SURAH_DATA.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export function searchSurah(query: string): Surah[] {
	const q = query.toLowerCase();
	return SURAH_DATA.filter((s) => s.name.toLowerCase().includes(q));
}

export function validateAyat(
	surahName: string,
	ayatValue: string,
): string | null {
	if (!surahName || !ayatValue) return null;
	const surah = findSurah(surahName);
	if (!surah) return null;
	const numbers = ayatValue.match(/\d+/g);
	if (!numbers) return null;
	const maxAyat = Math.max(...numbers.map(Number));
	if (maxAyat > surah.ayatCount) {
		return `${surah.name} hanya memiliki ${surah.ayatCount} ayat. Ayat yang dimasukkan (${maxAyat}) melebihi batas.`;
	}
	return null;
}

// ponytail: simplified juz calculation — for multi-juz surahs returns juzStart
export function getJuzForAyat(surahName: string, ayatNumber: number): number {
	const surah = findSurah(surahName);
	if (!surah) return 0;
	if (surah.juzStart === surah.juzEnd) return surah.juzStart;
	// ponytail: only surahs 2,3,4,5,6,7,8,9,10,11,23,37,39 span multiple juz
	// simplified: return the juz based on ayat midpoint
	const mid = surah.ayatCount / 2;
	return ayatNumber <= mid ? surah.juzStart : surah.juzEnd;
}
