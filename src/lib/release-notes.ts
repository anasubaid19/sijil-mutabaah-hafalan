export type ReleaseItemKind =
	| "Fitur baru"
	| "Perbaikan"
	| "Peningkatan"
	| "Catatan";

export interface ReleaseItem {
	kind: ReleaseItemKind;
	text: string;
}

export interface ReleaseNote {
	/** Id unik rilis, dipakai untuk menandai banner sudah dibaca. */
	id: string;
	/** Tanggal rilis (YYYY-MM-DD). */
	date: string;
	title: string;
	items: ReleaseItem[];
}

/**
 * Narasi banner "Yang baru di Sijil". Dikelola manual oleh agen yang mengerjakan
 * perubahan, bukan diambil mentah dari pesan commit, supaya bahasanya jelas
 * untuk pengguna.
 *
 * Cara menambah rilis: taruh entri baru di paling atas daftar dengan `id` baru
 * (tanggal + topik singkat), lalu tulis 1–3 poin yang benar-benar dirasakan
 * pengguna. Banner hanya muncul untuk rilis di atas `id` yang terakhir ditutup
 * pengguna, jadi rilis lama tidak perlu dihapus.
 */
export const RELEASES: ReleaseNote[] = [
	{
		id: "2026-10-25-profil-sekolah-per-akun",
		date: "2026-10-25",
		title: "Profil sekolah kini tersimpan per akun",
		items: [
			{
				kind: "Perbaikan",
				text: "Logo, nama yayasan, dan nama sekolah yang diisi di Pengaturan → Profil Sekolah sekarang hanya berlaku untuk akun Anda. Sebelumnya data ini tersimpan sebagai pengaturan bersama, sehingga isian seorang musyrif bisa menimpa tampilan musyrif lain.",
			},
			{
				kind: "Perbaikan",
				text: "Header laporan PDF memakai identitas sekolah milik akun yang mengekspor laporan.",
			},
			{
				kind: "Catatan",
				text: "Bila sebelumnya Anda sudah mengisi profil sekolah, isi ulang sekali di Pengaturan → Profil Sekolah karena data lama tersimpan sebagai pengaturan bersama.",
			},
		],
	},
];

export interface UnseenRelease {
	/** Id rilis terbaru; disimpan saat banner ditutup. */
	acknowledgeId: string;
	title: string;
	date: string;
	items: ReleaseItem[];
	/** Jumlah poin lain yang tidak ditampilkan agar banner tetap ringkas. */
	hiddenCount: number;
}

/**
 * Poin perubahan yang belum dilihat pengguna di browser ini.
 *
 * `lastSeenId` adalah id rilis terakhir yang sudah ditutup. Pengguna baru (belum
 * pernah menutup banner) hanya melihat rilis terbaru supaya banner tidak
 * membengkak dengan riwayat lama.
 */
export function selectUnseenRelease(
	releases: ReleaseNote[],
	lastSeenId: string | null,
	limit = 4,
): UnseenRelease | null {
	const newest = releases[0];
	if (!newest) return null;
	if (lastSeenId === newest.id) return null;

	const lastSeenIndex = lastSeenId
		? releases.findIndex((r) => r.id === lastSeenId)
		: -1;

	let unseen: ReleaseNote[];
	if (lastSeenIndex > 0) {
		// Semua rilis setelah rilis terakhir yang ditutup.
		unseen = releases.slice(0, lastSeenIndex);
	} else if (lastSeenIndex === 0) {
		return null;
	} else if (lastSeenId) {
		// Rilis yang diakui sudah tidak ada di daftar; tampilkan yang terbaru saja.
		unseen = releases.slice(0, 1);
	} else {
		unseen = releases.slice(0, 1);
	}

	const items = unseen.flatMap((release) => release.items);
	if (items.length === 0) return null;

	return {
		acknowledgeId: newest.id,
		title: newest.title,
		date: newest.date,
		items: items.slice(0, limit),
		hiddenCount: Math.max(0, items.length - limit),
	};
}
