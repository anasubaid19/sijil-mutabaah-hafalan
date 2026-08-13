import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Siswa, StudentDialog } from "@/components/student-dialog";
import { StudentList } from "@/components/student-list";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnsavedChangesGuard } from "@/components/unsaved-changes";

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
	const navigate = useNavigate();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [loading, setLoading] = useState(true);
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" && window.innerWidth < 768,
	);

	// Profile fields
	const [nama, setNama] = useState("");
	const [halaqahName, setHalaqahName] = useState("");

	// Siswa dialog
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
	const [siswaToDelete, setSiswaToDelete] = useState<string | null>(null);

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

	async function refreshSiswa() {
		const sRes = await fetch("/api/siswa");
		if (sRes.ok) setSiswaList(await sRes.json());
	}

	async function deleteSiswa(id: string) {
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

	const profileDirty =
		nama !== (profile?.nama ?? "") ||
		halaqahName !== (profile?.halaqahName ?? "");

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-sm text-muted-foreground">Memuat...</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-6">
			{isMobile ? (
				<div className="rounded-2xl border bg-card p-8 text-center shadow-xs">
					<p className="text-sm text-muted-foreground">
						Gunakan{" "}
						<span className="font-semibold text-foreground">Pengaturan</span>{" "}
						untuk mengelola data di perangkat mobile.
					</p>
					<Button
						className="mt-4"
						onClick={() => navigate({ to: "/pengaturan" })}
					>
						Buka Pengaturan
					</Button>
				</div>
			) : (
				<>
					<div>
						<h2 className="text-lg font-semibold">Manajemen Data</h2>
						<p className="text-sm text-muted-foreground">
							Kelola data inti halaqah dan siswa di sini.
						</p>
					</div>

					{/* Informasi Halaqah */}
					<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
						<div>
							<h3 className="text-lg font-semibold">Informasi Halaqah</h3>
							<p className="text-xs text-muted-foreground">
								Nama halaqah atau grup Anda.
							</p>
						</div>
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
								<Button type="submit" disabled={!profileDirty}>
									Simpan
								</Button>
								{profileDirty && (
									<span className="flex items-center gap-1.5 text-xs text-amber-600">
										<span className="size-1.5 rounded-full bg-amber-500" />
										Belum disimpan
									</span>
								)}
							</div>
						</form>
					</section>

					{/* Profil Musyrif */}
					<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
						<div>
							<h3 className="text-lg font-semibold">Profil Musyrif/Ustadz</h3>
							<p className="text-xs text-muted-foreground">
								Identitas pengelola halaqah.
							</p>
						</div>
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
								<Button type="submit" disabled={!profileDirty}>
									Simpan Profil
								</Button>
								{profileDirty && (
									<span className="flex items-center gap-1.5 text-xs text-amber-600">
										<span className="size-1.5 rounded-full bg-amber-500" />
										Belum disimpan
									</span>
								)}
							</div>
						</form>
					</section>

					{/* Kelola Siswa */}
					<section className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between gap-2">
							<div>
								<h3 className="text-lg font-semibold">Kelola Siswa</h3>
								<p className="text-xs text-muted-foreground">
									Tambah, ubah, atau hapus siswa beserta target hafalannya.
								</p>
							</div>
							<Button onClick={openAddSiswa}>Tambah Siswa</Button>
						</div>
						<StudentList
							siswaList={siswaList}
							onEdit={openEditSiswa}
							onDelete={(id) => setSiswaToDelete(id)}
							onAdd={openAddSiswa}
						/>
					</section>
				</>
			)}

			<StudentDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				editingSiswa={editingSiswa}
				onSaved={refreshSiswa}
			/>
			<AlertDialog open={siswaToDelete !== null} onOpenChange={(o) => !o && setSiswaToDelete(null)}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus siswa ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Data siswa beserta riwayat hafalannya akan dihapus dan tidak dapat
							dipulihkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setSiswaToDelete(null)}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								const id = siswaToDelete;
								setSiswaToDelete(null);
								if (id) deleteSiswa(id);
							}}
						>
							Hapus siswa
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<UnsavedChangesGuard dirty={profileDirty} />
		</div>
	);
}
