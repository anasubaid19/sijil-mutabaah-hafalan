import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Siswa, StudentDialog } from "@/components/student-dialog";
import { StudentList } from "@/components/student-list";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnsavedChangesGuard } from "@/components/unsaved-changes";
import { authClient } from "@/lib/auth/auth-client";

interface UserProfile {
	id: string;
	nama: string;
	role: string;
	halaqahName?: string;
}

export const Route = createFileRoute("/_authed/pengaturan")({
	component: PengaturanPage,
});

// ---------------------------------------------------------------------------
// Section building blocks (shared desktop tab / mobile accordion)
// ---------------------------------------------------------------------------

function SectionTitle({
	title,
	description,
	compact,
}: {
	title: string;
	description: string;
	compact?: boolean;
}) {
	return (
		<div>
			<h3
				className={
					compact ? "text-base font-semibold" : "text-lg font-semibold"
				}
			>
				{title}
			</h3>
			<p className="text-xs text-muted-foreground">{description}</p>
		</div>
	);
}

interface ProfileSectionProps {
	compact?: boolean;
	dirty: boolean;
	nama: string;
	setNama: (v: string) => void;
	halaqahName: string;
	setHalaqahName: (v: string) => void;
	saveProfile: (e: React.FormEvent) => void;
}

function ProfileSection({
	compact,
	dirty,
	nama,
	setNama,
	halaqahName,
	setHalaqahName,
	saveProfile,
}: ProfileSectionProps) {
	return (
		<>
			<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
				<SectionTitle
					title="Informasi Halaqah"
					description="Nama halaqah atau grup Anda."
					compact={compact}
				/>
				<form onSubmit={saveProfile} className="space-y-3">
					<div className="space-y-2">
						<label htmlFor="halaqah-name" className="text-sm font-medium">
							Nama Halaqah
						</label>
						<Input
							id="halaqah-name"
							type="text"
							value={halaqahName}
							onChange={(e) => setHalaqahName(e.target.value)}
							placeholder="Contoh: Halaqah Putra A"
						/>
					</div>
					<div className="flex items-center gap-3">
						<Button
							type="submit"
							size={compact ? "sm" : "default"}
							disabled={!dirty}
						>
							Simpan
						</Button>
						{dirty && (
							<span className="flex items-center gap-1.5 text-xs text-amber-600">
								<span className="size-1.5 rounded-full bg-amber-500" />
								Belum disimpan
							</span>
						)}
					</div>
				</form>
			</section>

			<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
				<SectionTitle
					title="Profil Musyrif/Ustadz"
					description="Identitas pengelola halaqah."
					compact={compact}
				/>
				<form onSubmit={saveProfile} className="space-y-3">
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
					<div className="flex items-center gap-3">
						<Button
							type="submit"
							size={compact ? "sm" : "default"}
							disabled={!dirty}
						>
							Simpan Profil
						</Button>
						{dirty && (
							<span className="flex items-center gap-1.5 text-xs text-amber-600">
								<span className="size-1.5 rounded-full bg-amber-500" />
								Belum disimpan
							</span>
						)}
					</div>
				</form>
			</section>
		</>
	);
}

interface SchoolSectionProps {
	compact?: boolean;
	dirty: boolean;
	schoolLogo: string;
	setSchoolLogo: (v: string) => void;
	schoolFoundationName: string;
	setSchoolFoundationName: (v: string) => void;
	schoolName: string;
	setSchoolName: (v: string) => void;
	handleSchoolLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	saveSchoolProfile: () => void;
	schoolSaving: boolean;
}

function PdfHeaderPreview({
	logo,
	foundation,
	school,
}: {
	logo: string;
	foundation: string;
	school: string;
}) {
	const hasText = foundation.trim() || school.trim();
	if (!logo && !hasText) {
		return (
			<div className="rounded-lg border border-dashed bg-muted/30 px-4 py-4 text-center text-xs text-muted-foreground">
				Preview header PDF akan tampil di sini setelah identitas diisi.
			</div>
		);
	}
	return (
		<div className="overflow-hidden rounded-lg border bg-background shadow-sm">
			<div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-3">
				{logo && (
					<img
						src={logo}
						alt="Logo sekolah"
						className="h-12 w-12 shrink-0 rounded border bg-white object-contain"
					/>
				)}
				<div className="min-w-0 flex-1">
					{foundation && (
						<p className="truncate text-[13px] leading-tight font-bold text-gray-800">
							{foundation}
						</p>
					)}
					{school && (
						<p className="truncate text-[11px] leading-tight text-gray-600">
							{school}
						</p>
					)}
					<p className="mt-0.5 text-[9px] tracking-wide text-gray-400">
						Laporan Hafalan Al-Qur'an
					</p>
				</div>
				<p className="hidden shrink-0 text-[8px] text-gray-400 sm:block">
					{new Date().toLocaleDateString("id-ID")}
				</p>
			</div>
			<div className="space-y-1.5 px-4 py-3">
				<div className="h-1.5 w-2/3 rounded bg-gray-100" />
				<div className="h-1.5 w-full rounded bg-gray-100" />
				<div className="h-1.5 w-3/4 rounded bg-gray-100" />
			</div>
		</div>
	);
}

function SchoolSection({
	compact,
	dirty,
	schoolLogo,
	setSchoolLogo,
	schoolFoundationName,
	setSchoolFoundationName,
	schoolName,
	setSchoolName,
	handleSchoolLogoUpload,
	saveSchoolProfile,
	schoolSaving,
}: SchoolSectionProps) {
	return (
		<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
			<SectionTitle
				title="Profil Sekolah"
				description="Identitas institusi untuk header PDF laporan."
				compact={compact}
			/>
			<PdfHeaderPreview
				logo={schoolLogo}
				foundation={schoolFoundationName}
				school={schoolName}
			/>
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
					<label htmlFor="school-foundation" className="text-sm font-medium">
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
						Judul utama di header PDF. Jika kosong, nama sekolah yang
						ditampilkan.
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
						Ditampilkan di bawah nama yayasan.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						onClick={saveSchoolProfile}
						disabled={!dirty || schoolSaving}
						size={compact ? "sm" : "default"}
					>
						{schoolSaving ? "Menyimpan..." : "Simpan"}
					</Button>
					{dirty && (
						<span className="flex items-center gap-1.5 text-xs text-amber-600">
							<span className="size-1.5 rounded-full bg-amber-500" />
							Belum disimpan
						</span>
					)}
				</div>
			</div>
		</section>
	);
}

interface AccountSectionProps {
	compact?: boolean;
	currentPassword: string;
	setCurrentPassword: (v: string) => void;
	newPassword: string;
	setNewPassword: (v: string) => void;
	confirmPassword: string;
	setConfirmPassword: (v: string) => void;
	changePassword: (e: React.FormEvent) => void;
}

function AccountSection({
	compact,
	currentPassword,
	setCurrentPassword,
	newPassword,
	setNewPassword,
	confirmPassword,
	setConfirmPassword,
	changePassword,
}: AccountSectionProps) {
	return (
		<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
			<SectionTitle
				title="Ganti Password"
				description="Perbarui password akun Anda secara berkala."
				compact={compact}
			/>
			<form onSubmit={changePassword} className="space-y-3">
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
				<Button
					type="submit"
					variant="outline"
					size={compact ? "sm" : "default"}
				>
					Ganti Password
				</Button>
			</form>
		</section>
	);
}

interface BackupSectionProps {
	compact?: boolean;
	exportJSON: () => void;
	importJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
	lastBackup: string | null;
}

function formatBackupDate(iso: string) {
	return new Date(iso).toLocaleString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function BackupSection({
	compact,
	exportJSON,
	importJSON,
	lastBackup,
}: BackupSectionProps) {
	return (
		<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
			<SectionTitle
				title="Backup & Restore"
				description="Ekspor profil dan daftar siswa, atau impor dari file backup."
				compact={compact}
			/>
			<div className="flex gap-3">
				<Button
					variant="outline"
					size={compact ? "sm" : "default"}
					onClick={exportJSON}
				>
					Export JSON
				</Button>
				<label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
					Import JSON
					<input
						type="file"
						accept=".json"
						onChange={importJSON}
						className="hidden"
					/>
				</label>
			</div>
			<div className="space-y-1">
				<p className="text-xs text-muted-foreground">
					{lastBackup
						? `Backup terakhir: ${formatBackupDate(lastBackup)}`
						: "Belum pernah membuat backup."}
				</p>
				<p className="text-xs text-muted-foreground">
					Backup menyimpan profil dan daftar siswa. Riwayat setoran tersimpan di
					database.
				</p>
			</div>
		</section>
	);
}

function TutorialSection({ compact }: { compact?: boolean }) {
	const navigate = useNavigate();
	return (
		<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
			<SectionTitle
				title="Tutorial"
				description="Lihat kembali panduan penggunaan aplikasi."
				compact={compact}
			/>
			<Button
				variant="outline"
				size={compact ? "sm" : "default"}
				onClick={() => {
					localStorage.removeItem("sijil_tutorial_done");
					window.dispatchEvent(new CustomEvent("sijil-restart-tutorial"));
					navigate({ to: "/dashboard" });
				}}
			>
				Mulai Ulang Tutorial
			</Button>
		</section>
	);
}

function DangerZoneSection({
	compact,
	siswaList,
	onClearAll,
}: {
	compact?: boolean;
	siswaList: Siswa[];
	onClearAll: () => void;
}) {
	const [confirmText, setConfirmText] = useState("");
	const enabled =
		confirmText.trim().toUpperCase() === "HAPUS" && siswaList.length > 0;
	return (
		<section className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-5 shadow-xs">
			<SectionTitle
				title="Zona Bahaya"
				description="Hapus semua siswa dan data. Tindakan ini tidak dapat dibatalkan."
				compact={compact}
			/>
			<div className="space-y-2">
				<label htmlFor="danger-confirm" className="text-sm font-medium">
					Ketik <span className="font-mono font-semibold">HAPUS</span> untuk
					konfirmasi
				</label>
				<Input
					id="danger-confirm"
					type="text"
					value={confirmText}
					onChange={(e) => setConfirmText(e.target.value)}
					placeholder="HAPUS"
					autoComplete="off"
					spellCheck={false}
					className="max-w-xs uppercase"
				/>
			</div>
			<Button
				variant="destructive"
				size={compact ? "sm" : "default"}
				disabled={!enabled}
				onClick={onClearAll}
			>
				Hapus Semua Siswa
			</Button>
			{siswaList.length === 0 && (
				<p className="text-xs text-muted-foreground">
					Belum ada siswa yang bisa dihapus.
				</p>
			)}
		</section>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function PengaturanPage() {
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

	// Siswa dialog
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);

	// School profile
	const [schoolLogo, setSchoolLogo] = useState("");
	const [schoolFoundationName, setSchoolFoundationName] = useState("");
	const [schoolName, setSchoolName] = useState("");
	const [schoolSaving, setSchoolSaving] = useState(false);

	// Baseline for unsaved-changes detection
	const [savedSchool, setSavedSchool] = useState({
		logo: "",
		foundationName: "",
		schoolName: "",
	});

	// Backup history
	const [lastBackup, setLastBackup] = useState<string | null>(null);

	// Accordion state persisted across navigation (mobile)
	const [accordionValue, setAccordionValue] = useState<string[]>([]);

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
					setSavedSchool({
						logo: sc.logo || "",
						foundationName: sc.foundationName || "",
						schoolName: sc.schoolName || "",
					});
				}
				setLastBackup(localStorage.getItem("sijil_last_backup"));
				const savedAccordion = localStorage.getItem("sijil_accordion_open");
				setAccordionValue(savedAccordion ? [savedAccordion] : []);
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
			if (res.ok) {
				toast.success("Profil sekolah tersimpan!");
				setSavedSchool({
					logo: schoolLogo,
					foundationName: schoolFoundationName,
					schoolName,
				});
			} else toast.error("Gagal menyimpan profil sekolah");
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

	async function refreshSiswa() {
		const sRes = await fetch("/api/siswa");
		if (sRes.ok) setSiswaList(await sRes.json());
	}

	async function deleteSiswa(id: string) {
		if (!confirm("Hapus siswa ini?")) return;
		const res = await fetch(`/api/siswa?id=${id}`, { method: "DELETE" });
		if (res.ok) {
			toast.success("Siswa dihapus");
			setSiswaList((prev) => prev.filter((s) => s.id !== id));
		}
	}

	function openAddSiswa() {
		setEditingSiswa(null);
		setDialogOpen(true);
	}

	function openEditSiswa(s: Siswa) {
		setEditingSiswa(s);
		setDialogOpen(true);
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
		// ponytail: last-backup tracked per browser via localStorage; move to
		// server if cross-device visibility matters.
		const now = new Date().toISOString();
		localStorage.setItem("sijil_last_backup", now);
		setLastBackup(now);
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
				await refreshSiswa();
			} catch {
				toast.error("File JSON tidak valid");
			}
		};
		reader.readAsText(file);
		e.target.value = "";
	}

	function clearAllSiswa() {
		(async () => {
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
				await refreshSiswa();
				toast.error(
					`${failed} siswa gagal dihapus (hapus data setoran terlebih dahulu)`,
				);
			}
		})();
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-sm text-muted-foreground">Memuat...</div>
			</div>
		);
	}

	const profileDirty =
		nama !== (profile?.nama ?? "") ||
		halaqahName !== (profile?.halaqahName ?? "");

	const schoolDirty =
		schoolLogo !== savedSchool.logo ||
		schoolFoundationName !== savedSchool.foundationName ||
		schoolName !== savedSchool.schoolName;

	const profileSectionProps = {
		dirty: profileDirty,
		nama,
		setNama,
		halaqahName,
		setHalaqahName,
		saveProfile,
	};
	const schoolSectionProps = {
		dirty: schoolDirty,
		schoolLogo,
		setSchoolLogo,
		schoolFoundationName,
		setSchoolFoundationName,
		schoolName,
		setSchoolName,
		handleSchoolLogoUpload,
		saveSchoolProfile,
		schoolSaving,
	};
	const accountSectionProps = {
		currentPassword,
		setCurrentPassword,
		newPassword,
		setNewPassword,
		confirmPassword,
		setConfirmPassword,
		changePassword,
	};
	const backupSectionProps = {
		exportJSON,
		importJSON,
		lastBackup,
	};

	// Manajemen Data content (halaqah + profil + kelola siswa) — mobile only;
	// desktop uses the dedicated Manajemen Data page.
	const manajemenDataContent = () => (
		<div className="space-y-4">
			<ProfileSection {...profileSectionProps} compact />
			<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
				<div className="flex items-center justify-between gap-2">
					<SectionTitle
						title="Kelola Siswa"
						description="Tambah, ubah, atau hapus siswa beserta target hafalannya."
						compact
					/>
					<Button size="sm" onClick={openAddSiswa}>
						Tambah Siswa
					</Button>
				</div>
				<StudentList
					siswaList={siswaList}
					onEdit={openEditSiswa}
					onDelete={deleteSiswa}
					onAdd={openAddSiswa}
				/>
			</section>
		</div>
	);

	const profilSekolahContent = (compact: boolean) => (
		<SchoolSection {...schoolSectionProps} compact={compact} />
	);
	const akunContent = (compact: boolean) => (
		<AccountSection {...accountSectionProps} compact={compact} />
	);
	const backupContent = (compact: boolean) => (
		<BackupSection {...backupSectionProps} compact={compact} />
	);
	const tutorialContent = (compact: boolean) => (
		<TutorialSection compact={compact} />
	);
	const zonabahayaContent = (compact: boolean) => (
		<DangerZoneSection
			compact={compact}
			siswaList={siswaList}
			onClearAll={clearAllSiswa}
		/>
	);

	return (
		<div className="mx-auto max-w-2xl space-y-6 pb-20 md:pb-6">
			<div>
				<h2 className="text-lg font-semibold">Pengaturan</h2>
				<p className="text-sm text-muted-foreground">
					Kelola konfigurasi aplikasi, akun, dan data.
				</p>
			</div>

			{isMobile ? (
				<Accordion
					value={accordionValue}
					onValueChange={(value) => {
						const next = Array.isArray(value) ? value[0] : undefined;
						setAccordionValue(Array.isArray(value) ? value : []);
						// ponytail: accordion state per browser via localStorage;
						// resets when the stored value is closed.
						if (next) localStorage.setItem("sijil_accordion_open", next);
						else localStorage.removeItem("sijil_accordion_open");
					}}
				>
					<AccordionItem value="manajemen-data">
						<AccordionTrigger>Manajemen Data</AccordionTrigger>
						<AccordionContent>{manajemenDataContent()}</AccordionContent>
					</AccordionItem>
					<AccordionItem value="sekolah">
						<AccordionTrigger>Profil Sekolah</AccordionTrigger>
						<AccordionContent>{profilSekolahContent(true)}</AccordionContent>
					</AccordionItem>
					<AccordionItem value="akun">
						<AccordionTrigger>Akun</AccordionTrigger>
						<AccordionContent>{akunContent(true)}</AccordionContent>
					</AccordionItem>
					<AccordionItem value="backup">
						<AccordionTrigger>Backup & Restore</AccordionTrigger>
						<AccordionContent>{backupContent(true)}</AccordionContent>
					</AccordionItem>
					<AccordionItem value="tutorial">
						<AccordionTrigger>Tutorial</AccordionTrigger>
						<AccordionContent>{tutorialContent(true)}</AccordionContent>
					</AccordionItem>
					<AccordionItem value="zonabahaya">
						<AccordionTrigger>Zona Bahaya</AccordionTrigger>
						<AccordionContent>{zonabahayaContent(true)}</AccordionContent>
					</AccordionItem>
				</Accordion>
			) : (
				<Tabs defaultValue="sekolah">
					<TabsList className="h-auto w-full">
						<TabsTrigger value="sekolah">Profil Sekolah</TabsTrigger>
						<TabsTrigger value="akun">Akun</TabsTrigger>
						<TabsTrigger value="backup">Backup & Restore</TabsTrigger>
						<TabsTrigger value="tutorial">Tutorial</TabsTrigger>
						<TabsTrigger value="zonabahaya">Zona Bahaya</TabsTrigger>
					</TabsList>

					<TabsContent value="sekolah" className="space-y-6">
						{profilSekolahContent(false)}
					</TabsContent>
					<TabsContent value="akun" className="space-y-6">
						{akunContent(false)}
					</TabsContent>
					<TabsContent value="backup" className="space-y-6">
						{backupContent(false)}
					</TabsContent>
					<TabsContent value="tutorial" className="space-y-6">
						{tutorialContent(false)}
					</TabsContent>
					<TabsContent value="zonabahaya" className="space-y-6">
						{zonabahayaContent(false)}
					</TabsContent>
				</Tabs>
			)}

			<StudentDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				editingSiswa={editingSiswa}
				onSaved={refreshSiswa}
			/>
			<UnsavedChangesGuard dirty={profileDirty || schoolDirty} />
		</div>
	);
}
