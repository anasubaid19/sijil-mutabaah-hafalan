import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SURAH_DATA } from "@/lib/surah-data";

interface Siswa {
	id: string;
	nama: string;
	studentId?: string;
	umur?: number;
	hafalan: number;
	target: number;
	ziyadah: number;
	murajaah: number;
	mulaiHafalan?: string;
	metodeProgress?: string;
}

interface UserProfile {
	id: string;
	nama: string;
	role: string;
	halaqahName?: string;
}

export const Route = createFileRoute("/_authed/manajemen-data")({
	component: ManajemenDataPage,
});

function ManajemenDataPage() {
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [loading, setLoading] = useState(true);
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" && window.innerWidth < 768,
	);

	// Profile fields
	const [nama, setNama] = useState("");
	const [halaqahName, setHalaqahName] = useState("");

	// Siswa form
	const [siswaNama, setSiswaNama] = useState("");
	const [siswaUmur, setSiswaUmur] = useState("");
	const [siswaMetode, setSiswaMetode] = useState<"juz" | "surah">("juz");
	const [siswaTargetFrom, setSiswaTargetFrom] = useState("1");
	const [siswaTargetTo, setSiswaTargetTo] = useState("30");
	const [editingSiswa, setEditingSiswa] = useState<string | null>(null);

	useEffect(() => {
		function onResize() {
			setIsMobile(window.innerWidth < 768);
		}
		window.addEventListener("resize", onResize);
		async function load() {
			try {
				const [pRes, sRes] = await Promise.all([
					fetch("/api/user-profile"),
					fetch("/api/siswa"),
				]);
				if (pRes.ok) {
					const p = await pRes.json();
					setProfile(p);
					if (p) {
						setNama(p.nama || "");
						setHalaqahName(p.halaqahName || "");
					}
				}
				if (sRes.ok) setSiswaList(await sRes.json());
			} catch {}
			setLoading(false);
		}
		load();
		return () => window.removeEventListener("resize", onResize);
	}, []);

	async function saveProfile(e: React.FormEvent) {
		e.preventDefault();
		const method = profile ? "PUT" : "POST";
		const res = await fetch("/api/user-profile", {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nama, role: "musyrif", halaqahName }),
		});
		if (res.ok) {
			toast.success("Profil tersimpan!");
			const p = await res.json();
			setProfile(p);
		} else {
			toast.error("Gagal menyimpan profil");
		}
	}

	async function addSiswa(e: React.FormEvent) {
		e.preventDefault();
		if (!siswaNama.trim()) return;

		const from =
			siswaMetode === "juz"
				? siswaTargetFrom
				: SURAH_DATA.find(
						(s) => s.number === Number.parseInt(siswaTargetFrom, 10),
					)?.name || "Al-Fatihah";

		const payload: Record<string, unknown> = {
			nama: siswaNama,
			umur: siswaUmur ? Number.parseInt(siswaUmur, 10) : undefined,
			mulaiHafalan: from,
			target: Number.parseInt(siswaTargetTo, 10) || 30,
			metodeProgress: siswaMetode,
		};

		if (editingSiswa) {
			payload.id = editingSiswa;
			const res = await fetch("/api/siswa", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (res.ok) {
				toast.success("Siswa diperbarui!");
				setEditingSiswa(null);
			}
		} else {
			const res = await fetch("/api/siswa", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (res.ok) toast.success("Siswa ditambahkan!");
		}

		setSiswaNama("");
		setSiswaUmur("");
		setSiswaMetode("juz");
		setSiswaTargetFrom("1");
		setSiswaTargetTo("30");
		const sRes = await fetch("/api/siswa");
		setSiswaList(await sRes.json());
	}

	async function deleteSiswa(id: string) {
		if (!confirm("Hapus siswa ini?")) return;
		const res = await fetch(`/api/siswa?id=${id}`, { method: "DELETE" });
		if (res.ok) {
			toast.success("Siswa dihapus");
			setSiswaList((prev) => prev.filter((s) => s.id !== id));
		}
	}

	function editSiswa(s: Siswa) {
		setEditingSiswa(s.id);
		setSiswaNama(s.nama);
		setSiswaUmur(s.umur?.toString() || "");
		const metode = (s.metodeProgress === "surah" ? "surah" : "juz") as
			| "juz"
			| "surah";
		setSiswaMetode(metode);
		if (metode === "surah") {
			const fromSurah = SURAH_DATA.find((sd) => sd.name === s.mulaiHafalan);
			const toSurah = SURAH_DATA.find((sd) => sd.number === s.target);
			setSiswaTargetFrom(fromSurah?.number.toString() || "1");
			setSiswaTargetTo(toSurah?.number.toString() || "114");
		} else {
			setSiswaTargetFrom(s.mulaiHafalan || "1");
			setSiswaTargetTo(s.target.toString());
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success("Disalin ke clipboard!");
	}

	function exportJSON() {
		const data = {
			profile,
			siswa: siswaList,
			exportedAt: new Date().toISOString(),
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `Backup_Sijil_${new Date().toISOString().split("T")[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Backup diekspor!");
	}

	function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = async (ev) => {
			try {
				const data = JSON.parse(ev.target?.result as string);
				if (data.profile) {
					await fetch("/api/user-profile", {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(data.profile),
					});
				}
				if (data.siswa) {
					for (const s of data.siswa) {
						await fetch("/api/siswa", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(s),
						});
					}
				}
				toast.success("Data diimpor!");
				const sRes = await fetch("/api/siswa");
				setSiswaList(await sRes.json());
			} catch {
				toast.error("File JSON tidak valid");
			}
		};
		reader.readAsText(file);
		e.target.value = "";
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-sm text-muted-foreground">Memuat...</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6 pb-20 md:pb-6">
			{isMobile ? (
				<div className="rounded-2xl border bg-card p-8 text-center shadow-xs">
					<p className="text-sm text-muted-foreground">
						Gunakan{" "}
						<span className="font-semibold text-foreground">Pengaturan</span>{" "}
						untuk mengelola data di perangkat mobile.
					</p>
				</div>
			) : (
				<>
					<h2 className="text-base font-semibold">Manajemen Data</h2>

					{/* Nama Halaqah */}
					<form
						onSubmit={saveProfile}
						className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs"
					>
						<h3 className="text-lg font-semibold">Nama Halaqah</h3>
						<div className="space-y-2">
							<label htmlFor="halaqah-name" className="text-sm font-medium">
								Nama Halaqah / Grup
							</label>
							<Input
								id="halaqah-name"
								type="text"
								value={halaqahName}
								onChange={(e) => setHalaqahName(e.target.value)}
								placeholder="Contoh: Halaqah Putra A"
							/>
						</div>
						<Button type="submit">Simpan</Button>
					</form>

					{/* Profil Musyrif */}
					<form
						onSubmit={saveProfile}
						className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs"
					>
						<h3 className="text-lg font-semibold">Profil Musyrif</h3>
						<div className="space-y-2">
							<label htmlFor="profile-nama" className="text-sm font-medium">
								Nama Lengkap
							</label>
							<Input
								id="profile-nama"
								type="text"
								value={nama}
								onChange={(e) => setNama(e.target.value)}
								placeholder="Ustadz/Ustadzah Ahmad"
								required
							/>
						</div>
						<Button type="submit">Simpan Profil</Button>
					</form>

					{/* Kelola Siswa */}
					<div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
						<h3 className="text-lg font-semibold">Kelola Siswa</h3>

						<form onSubmit={addSiswa} className="space-y-3">
							<div className="grid gap-3 sm:grid-cols-3">
								<div className="space-y-1">
									<label htmlFor="siswa-nama" className="text-sm font-medium">
										Nama
									</label>
									<Input
										id="siswa-nama"
										type="text"
										value={siswaNama}
										onChange={(e) => setSiswaNama(e.target.value)}
										placeholder="Nama siswa"
										required
									/>
								</div>
								<div className="space-y-1">
									<label htmlFor="siswa-umur" className="text-sm font-medium">
										Umur
									</label>
									<Input
										id="siswa-umur"
										type="number"
										value={siswaUmur}
										onChange={(e) => setSiswaUmur(e.target.value)}
										placeholder="7"
									/>
								</div>
								<div className="space-y-1">
									<label htmlFor="siswa-metode" className="text-sm font-medium">
										Metode
									</label>
									<select
										id="siswa-metode"
										value={siswaMetode}
										onChange={(e) => {
											const v = e.target.value as "juz" | "surah";
											setSiswaMetode(v);
											setSiswaTargetFrom(v === "juz" ? "1" : "1");
											setSiswaTargetTo(v === "juz" ? "30" : "114");
										}}
										className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors md:text-sm"
									>
										<option value="juz">Per Juz</option>
										<option value="surah">Per Surah</option>
									</select>
								</div>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="space-y-1">
									<label
										htmlFor="siswa-target-from"
										className="text-sm font-medium"
									>
										{siswaMetode === "juz" ? "Mulai Juz" : "Mulai Surah"}
									</label>
									{siswaMetode === "juz" ? (
										<select
											id="siswa-target-from"
											value={siswaTargetFrom}
											onChange={(e) => setSiswaTargetFrom(e.target.value)}
											className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors md:text-sm"
										>
											{Array.from({ length: 30 }, (_, i) => (
												<option key={i + 1} value={i + 1}>
													Juz {i + 1}
												</option>
											))}
										</select>
									) : (
										<select
											id="siswa-target-from"
											value={siswaTargetFrom}
											onChange={(e) => setSiswaTargetFrom(e.target.value)}
											className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors md:text-sm"
										>
											{SURAH_DATA.map((s) => (
												<option key={s.number} value={s.number}>
													{s.number}. {s.name}
												</option>
											))}
										</select>
									)}
								</div>
								<div className="space-y-1">
									<label
										htmlFor="siswa-target-to"
										className="text-sm font-medium"
									>
										{siswaMetode === "juz" ? "Sampai Juz" : "Sampai Surah"}
									</label>
									{siswaMetode === "juz" ? (
										<select
											id="siswa-target-to"
											value={siswaTargetTo}
											onChange={(e) => setSiswaTargetTo(e.target.value)}
											className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors md:text-sm"
										>
											{Array.from({ length: 30 }, (_, i) => (
												<option key={i + 1} value={i + 1}>
													Juz {i + 1}
												</option>
											))}
										</select>
									) : (
										<select
											id="siswa-target-to"
											value={siswaTargetTo}
											onChange={(e) => setSiswaTargetTo(e.target.value)}
											className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors md:text-sm"
										>
											{SURAH_DATA.map((s) => (
												<option key={s.number} value={s.number}>
													{s.number}. {s.name}
												</option>
											))}
										</select>
									)}
								</div>
							</div>
							<div className="flex gap-2">
								<Button type="submit">
									{editingSiswa ? "Update" : "Tambah Siswa"}
								</Button>
								{editingSiswa && (
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setEditingSiswa(null);
											setSiswaNama("");
											setSiswaUmur("");
											setSiswaMetode("juz");
											setSiswaTargetFrom("1");
											setSiswaTargetTo("30");
										}}
									>
										Batal
									</Button>
								)}
							</div>
						</form>

						{/* Siswa List */}
						{siswaList.length > 0 ? (
							<div className="space-y-2 border-t border-border pt-4">
								{siswaList.map((s) => (
									<div
										key={s.id}
										className="space-y-2 rounded-xl bg-muted/50 px-4 py-3"
									>
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm font-semibold">{s.nama}</p>
												<p className="text-xs text-muted-foreground">
													{s.hafalan}/{s.target}{" "}
													{s.metodeProgress === "surah" ? "surah" : "juz"}
													{s.mulaiHafalan ? ` (dari ${s.mulaiHafalan})` : ""}
													{s.umur ? ` · ${s.umur} tahun` : ""}
												</p>
											</div>
											<div className="flex gap-1">
												<button
													type="button"
													onClick={() => editSiswa(s)}
													className="rounded-lg px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
												>
													Edit
												</button>
												<button
													type="button"
													onClick={() => deleteSiswa(s.id)}
													className="rounded-lg px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10"
												>
													Hapus
												</button>
											</div>
										</div>
										{s.studentId && (
											<div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs">
												<span className="text-muted-foreground">ID:</span>
												<code className="font-mono font-semibold">
													{s.studentId}
												</code>
												<button
													type="button"
													onClick={() => {
														if (s.studentId) copyToClipboard(s.studentId);
													}}
													className="ml-auto text-primary hover:underline"
												>
													Salin
												</button>
											</div>
										)}
									</div>
								))}
							</div>
						) : (
							<p className="py-4 text-center text-sm text-muted-foreground">
								Belum ada siswa
							</p>
						)}
					</div>

					{/* Backup & Import */}
					<div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
						<h3 className="text-lg font-semibold">Backup & Import</h3>
						<div className="flex gap-3">
							<Button variant="outline" onClick={exportJSON}>
								Export JSON
							</Button>
							<label className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground cursor-pointer">
								Import JSON
								<input
									type="file"
									accept=".json"
									onChange={importJSON}
									className="hidden"
								/>
							</label>
						</div>
						<p className="text-xs text-muted-foreground">
							Backup menyimpan profil dan daftar siswa. Riwayat setoran
							tersimpan di database.
						</p>
					</div>
				</>
			)}
		</div>
	);
}
