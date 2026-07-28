import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { SURAH_DATA } from "@/lib/surah-data";

interface Siswa {
	id: string;
	nama: string;
	studentId?: string;
	parentPassword?: string;
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

export const Route = createFileRoute("/_authed/pengaturan")({
	component: PengaturanPage,
});

function PengaturanPage() {
	const navigate = useNavigate();
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" && window.innerWidth < 768,
	);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [loading, setLoading] = useState(true);

	// Profile
	const [nama, setNama] = useState("");
	const [halaqahName, setHalaqahName] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");

	// Siswa form
	const [siswaNama, setSiswaNama] = useState("");
	const [siswaUmur, setSiswaUmur] = useState("");
	const [siswaMetode, setSiswaMetode] = useState<"juz" | "surah">("juz");
	const [siswaTargetFrom, setSiswaTargetFrom] = useState("1");
	const [siswaTargetTo, setSiswaTargetTo] = useState("30");
	const [editingSiswa, setEditingSiswa] = useState<string | null>(null);

	// School profile
	const [schoolLogo, setSchoolLogo] = useState("");
	const [schoolFoundationName, setSchoolFoundationName] = useState("");
	const [schoolName, setSchoolName] = useState("");
	const [schoolSaving, setSchoolSaving] = useState(false);

	useEffect(() => {
		function onResize() {
			setIsMobile(window.innerWidth < 768);
		}
		window.addEventListener("resize", onResize);
		async function load() {
			try {
				const [pRes, sRes, scRes] = await Promise.all([
					fetch("/api/user-profile"),
					fetch("/api/siswa"),
					fetch("/api/school-profile"),
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
				if (scRes.ok) {
					const sc = await scRes.json();
					setSchoolLogo(sc.logo || "");
					setSchoolFoundationName(sc.foundationName || "");
					setSchoolName(sc.schoolName || "");
				}
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

	async function changePassword(e: React.FormEvent) {
		e.preventDefault();
		if (!currentPassword) {
			toast.error("Isi password saat ini");
			return;
		}
		if (newPassword.length < 8) {
			toast.error("Password minimal 8 karakter");
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error("Password tidak cocok");
			return;
		}
		const { error } = await authClient.changePassword({
			newPassword,
			currentPassword,
		});
		if (error) {
			toast.error(error.message || "Gagal mengubah password");
		} else {
			toast.success("Password berhasil diubah!");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		}
	}

	async function saveSchoolProfile() {
		setSchoolSaving(true);
		try {
			const res = await fetch("/api/school-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					logo: schoolLogo,
					foundationName: schoolFoundationName,
					schoolName,
				}),
			});
			if (res.ok) toast.success("Profil sekolah tersimpan!");
			else toast.error("Gagal menyimpan profil sekolah");
		} catch {
			toast.error("Gagal menyimpan profil sekolah");
		}
		setSchoolSaving(false);
	}

	function handleSchoolLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 2 * 1024 * 1024) {
			toast.error("Maksimal 2 MB");
			return;
		}
		if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)) {
			toast.error("Format: PNG, JPG, atau SVG");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => setSchoolLogo(reader.result as string);
		reader.readAsDataURL(file);
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

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success("Disalin ke clipboard!");
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
			<h2 className="text-base font-semibold">Pengaturan</h2>

			{isMobile ? (
				<Accordion>
					<AccordionItem>
						<AccordionTrigger>Manajemen Data</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-6">
								<form onSubmit={saveProfile} className="space-y-3">
									<h3 className="text-base font-semibold">Nama Halaqah</h3>
									<div className="space-y-2">
										<label
											htmlFor="halaqah-name"
											className="text-sm font-medium"
										>
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
									<Button type="submit" size="sm">
										Simpan
									</Button>
								</form>

								<hr className="border-border" />

								<form onSubmit={saveProfile} className="space-y-3">
									<h3 className="text-base font-semibold">
										Profil Ustadz/Ustadzah
									</h3>
									<div className="space-y-2">
										<label
											htmlFor="profile-nama"
											className="text-sm font-medium"
										>
											Nama
										</label>
										<Input
											id="profile-nama"
											type="text"
											value={nama}
											onChange={(e) => setNama(e.target.value)}
											placeholder="Nama lengkap"
											required
										/>
									</div>
									<Button type="submit" size="sm">
										Simpan Profil
									</Button>
								</form>

								<hr className="border-border" />

								<div className="space-y-3">
									<h3 className="text-base font-semibold">Kelola Siswa</h3>

									<form onSubmit={addSiswa} className="space-y-3">
										<div className="grid gap-3 sm:grid-cols-3">
											<div className="space-y-1">
												<label
													htmlFor="siswa-nama"
													className="text-sm font-medium"
												>
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
												<label
													htmlFor="siswa-umur"
													className="text-sm font-medium"
												>
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
												<label
													htmlFor="siswa-metode"
													className="text-sm font-medium"
												>
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
													{siswaMetode === "juz"
														? "Sampai Juz"
														: "Sampai Surah"}
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
											<Button type="submit" size="sm">
												{editingSiswa ? "Update" : "Tambah Siswa"}
											</Button>
											{editingSiswa && (
												<Button
													type="button"
													variant="outline"
													size="sm"
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
																{s.mulaiHafalan
																	? ` (dari ${s.mulaiHafalan})`
																	: ""}
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
							</div>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem>
						<AccordionTrigger>Profil Sekolah</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-3">
								<p className="text-xs text-muted-foreground">
									Konfigurasi identitas institusi untuk header PDF.
								</p>
								<div className="space-y-4">
									<div className="space-y-2">
										<label className="text-sm font-medium">Logo Sekolah</label>
										{schoolLogo ? (
											<div className="flex items-center gap-4">
												<img
													src={schoolLogo}
													alt="Logo"
													className="h-16 w-16 rounded-lg border object-contain"
												/>
												<div className="flex gap-2">
													<label className="cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
														Ganti
														<input
															type="file"
															accept="image/png,image/jpeg,image/svg+xml"
															onChange={handleSchoolLogoUpload}
															className="hidden"
														/>
													</label>
													<button
														type="button"
														onClick={() => setSchoolLogo("")}
														className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
													>
														Hapus
													</button>
												</div>
											</div>
										) : (
											<label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-xs text-muted-foreground hover:bg-muted/50">
												<span>
													Klik untuk upload (PNG, JPG, SVG — maks 2 MB)
												</span>
												<input
													type="file"
													accept="image/png,image/jpeg,image/svg+xml"
													onChange={handleSchoolLogoUpload}
													className="hidden"
												/>
											</label>
										)}
									</div>
									<div className="space-y-2">
										<label
											htmlFor="school-foundation"
											className="text-sm font-medium"
										>
											Nama Yayasan
										</label>
										<Input
											id="school-foundation"
											type="text"
											value={schoolFoundationName}
											onChange={(e) => setSchoolFoundationName(e.target.value)}
											placeholder="Yayasan Pendidikan ..."
										/>
										<p className="text-xs text-muted-foreground">
											Ditampilkan sebagai judul utama di header PDF.
										</p>
									</div>
									<div className="space-y-2">
										<label
											htmlFor="school-name"
											className="text-sm font-medium"
										>
											Nama Sekolah
										</label>
										<Input
											id="school-name"
											type="text"
											value={schoolName}
											onChange={(e) => setSchoolName(e.target.value)}
											placeholder="SDIT / SMPIT / SMAIT ..."
										/>
										<p className="text-xs text-muted-foreground">
											Ditampilkan di bawah nama yayasan. Jika yayasan kosong,
											nama sekolah menjadi judul utama.
										</p>
									</div>
									<Button
										onClick={saveSchoolProfile}
										disabled={schoolSaving}
										size="sm"
									>
										{schoolSaving ? "Menyimpan..." : "Simpan"}
									</Button>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem>
						<AccordionTrigger>Tutorial</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-3">
								<p className="text-xs text-muted-foreground">
									Lihat kembali panduan penggunaan aplikasi.
								</p>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										localStorage.removeItem("sijil_tutorial_done");
										window.dispatchEvent(
											new CustomEvent("sijil-restart-tutorial"),
										);
										navigate({ to: "/dashboard" });
									}}
								>
									Mulai Ulang Tutorial
								</Button>
							</div>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem>
						<AccordionTrigger>Lainnya</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-6">
								<form onSubmit={changePassword} className="space-y-3">
									<h3 className="text-base font-semibold">Ganti Password</h3>
									<div className="space-y-2">
										<label
											htmlFor="current-password"
											className="text-sm font-medium"
										>
											Password Saat Ini
										</label>
										<Input
											id="current-password"
											type="password"
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											placeholder="Password lama"
											required
										/>
									</div>
									<div className="space-y-2">
										<label
											htmlFor="new-password"
											className="text-sm font-medium"
										>
											Password Baru
										</label>
										<Input
											id="new-password"
											type="password"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder="Minimal 8 karakter"
											minLength={8}
										/>
									</div>
									<div className="space-y-2">
										<label
											htmlFor="confirm-password"
											className="text-sm font-medium"
										>
											Konfirmasi Password
										</label>
										<Input
											id="confirm-password"
											type="password"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											placeholder="Ulangi password baru"
											minLength={8}
										/>
									</div>
									<Button type="submit" variant="outline" size="sm">
										Ganti Password
									</Button>
								</form>

								<hr className="border-border" />

								<div className="space-y-3">
									<h3 className="text-base font-semibold">Backup & Import</h3>
									<div className="flex gap-3">
										<Button variant="outline" size="sm" onClick={exportJSON}>
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

								<hr className="border-border" />

								<div className="space-y-3">
									<h3 className="text-base font-semibold text-destructive">
										Zona Bahaya
									</h3>
									<p className="text-xs text-muted-foreground">
										Hapus semua siswa dan data. Tindakan ini tidak dapat
										dibatalkan.
									</p>
									<Button
										variant="destructive"
										size="sm"
										onClick={async () => {
											if (!confirm("Yakin ingin menghapus semua siswa?"))
												return;
											let failed = 0;
											for (const s of siswaList) {
												const res = await fetch(`/api/siswa?id=${s.id}`, {
													method: "DELETE",
												});
												if (!res.ok) failed++;
											}
											if (failed === 0) {
												setSiswaList([]);
												toast.success("Semua siswa dihapus");
											} else {
												const sRes = await fetch("/api/siswa");
												if (sRes.ok) setSiswaList(await sRes.json());
												toast.error(
													`${failed} siswa gagal dihapus (hapus data setoran terlebih dahulu)`,
												);
											}
										}}
									>
										Hapus Semua Siswa
									</Button>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			) : (
				<>
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

					{/* Profile */}
					<form
						onSubmit={saveProfile}
						className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs"
					>
						<h3 className="text-lg font-semibold">Profil Ustadz/Ustadzah</h3>
						<div className="space-y-2">
							<label htmlFor="profile-nama" className="text-sm font-medium">
								Nama
							</label>
							<Input
								id="profile-nama"
								type="text"
								value={nama}
								onChange={(e) => setNama(e.target.value)}
								placeholder="Nama lengkap"
								required
							/>
						</div>
						<Button type="submit">Simpan Profil</Button>
					</form>

					{/* Change Password */}
					<form
						onSubmit={changePassword}
						className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs"
					>
						<h3 className="text-lg font-semibold">Ganti Password</h3>
						<div className="space-y-2">
							<label htmlFor="current-password" className="text-sm font-medium">
								Password Saat Ini
							</label>
							<Input
								id="current-password"
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								placeholder="Password lama"
								required
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="new-password" className="text-sm font-medium">
								Password Baru
							</label>
							<Input
								id="new-password"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Minimal 8 karakter"
								minLength={8}
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="confirm-password" className="text-sm font-medium">
								Konfirmasi Password
							</label>
							<Input
								id="confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Ulangi password baru"
								minLength={8}
							/>
						</div>
						<Button type="submit" variant="outline">
							Ganti Password
						</Button>
					</form>

					{/* School Profile */}
					<div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
						<h3 className="text-lg font-semibold">Profil Sekolah</h3>
						<p className="text-xs text-muted-foreground">
							Konfigurasi identitas institusi untuk header PDF.
						</p>
						<div className="space-y-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">Logo Sekolah</label>
								{schoolLogo ? (
									<div className="flex items-center gap-4">
										<img
											src={schoolLogo}
											alt="Logo"
											className="h-16 w-16 rounded-lg border object-contain"
										/>
										<div className="flex gap-2">
											<label className="cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
												Ganti
												<input
													type="file"
													accept="image/png,image/jpeg,image/svg+xml"
													onChange={handleSchoolLogoUpload}
													className="hidden"
												/>
											</label>
											<button
												type="button"
												onClick={() => setSchoolLogo("")}
												className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
											>
												Hapus
											</button>
										</div>
									</div>
								) : (
									<label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-xs text-muted-foreground hover:bg-muted/50">
										<span>Klik untuk upload (PNG, JPG, SVG — maks 2 MB)</span>
										<input
											type="file"
											accept="image/png,image/jpeg,image/svg+xml"
											onChange={handleSchoolLogoUpload}
											className="hidden"
										/>
									</label>
								)}
							</div>
							<div className="space-y-2">
								<label
									htmlFor="school-foundation"
									className="text-sm font-medium"
								>
									Nama Yayasan
								</label>
								<Input
									id="school-foundation"
									type="text"
									value={schoolFoundationName}
									onChange={(e) => setSchoolFoundationName(e.target.value)}
									placeholder="Yayasan Pendidikan ..."
								/>
								<p className="text-xs text-muted-foreground">
									Ditampilkan sebagai judul utama di header PDF.
								</p>
							</div>
							<div className="space-y-2">
								<label htmlFor="school-name" className="text-sm font-medium">
									Nama Sekolah
								</label>
								<Input
									id="school-name"
									type="text"
									value={schoolName}
									onChange={(e) => setSchoolName(e.target.value)}
									placeholder="SDIT / SMPIT / SMAIT ..."
								/>
								<p className="text-xs text-muted-foreground">
									Ditampilkan di bawah nama yayasan. Jika yayasan kosong, nama
									sekolah menjadi judul utama.
								</p>
							</div>
							<Button onClick={saveSchoolProfile} disabled={schoolSaving}>
								{schoolSaving ? "Menyimpan..." : "Simpan"}
							</Button>
						</div>
					</div>

					{/* Siswa Management */}
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

					{/* Tutorial */}
					<div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
						<h3 className="text-lg font-semibold">Tutorial</h3>
						<p className="text-xs text-muted-foreground">
							Lihat kembali panduan penggunaan aplikasi.
						</p>
						<Button
							variant="outline"
							onClick={() => {
								localStorage.removeItem("sijil_tutorial_done");
								window.dispatchEvent(new CustomEvent("sijil-restart-tutorial"));
								navigate({ to: "/dashboard" });
							}}
						>
							Mulai Ulang Tutorial
						</Button>
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

					{/* Danger Zone */}
					<div className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-5 shadow-xs">
						<h3 className="text-lg font-semibold text-destructive">
							Zona Bahaya
						</h3>
						<p className="text-xs text-muted-foreground">
							Hapus semua siswa dan data. Tindakan ini tidak dapat dibatalkan.
						</p>
						<Button
							variant="destructive"
							onClick={async () => {
								if (!confirm("Yakin ingin menghapus semua siswa?")) return;
								let failed = 0;
								for (const s of siswaList) {
									const res = await fetch(`/api/siswa?id=${s.id}`, {
										method: "DELETE",
									});
									if (!res.ok) failed++;
								}
								if (failed === 0) {
									setSiswaList([]);
									toast.success("Semua siswa dihapus");
								} else {
									const sRes = await fetch("/api/siswa");
									if (sRes.ok) setSiswaList(await sRes.json());
									toast.error(
										`${failed} siswa gagal dihapus (hapus data setoran terlebih dahulu)`,
									);
								}
							}}
						>
							Hapus Semua Siswa
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
