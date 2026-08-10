export interface ReleaseNote {
	id: string;
	title: string;
	items: string[];
}

export const LATEST_RELEASE: ReleaseNote | null = {
	id: "v1.5.0-kitab",
	title: "Yang baru di Sijil",
	items: [
		"Fitur baru: halaman Kitab untuk membaca matan (Tuhfatul Athfal & Jazariyyah).",
		"Revisi: rekomendasi setoran otomatis lanjut ke posisi ayat berikutnya.",
	],
};