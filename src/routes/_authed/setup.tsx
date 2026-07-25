import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StudentRow {
	nama: string;
	umur: string;
	target: string;
}

export const Route = createFileRoute("/_authed/setup")({
	component: SetupPage,
});

function SetupPage() {
	const navigate = useNavigate();
	const [nama, setNama] = useState("");
	const [students, setStudents] = useState<StudentRow[]>([
		{ nama: "", umur: "", target: "30" },
	]);
	const [loading, setLoading] = useState(false);

	function addStudentRow() {
		setStudents((prev) => [...prev, { nama: "", umur: "", target: "30" }]);
	}

	function removeStudentRow(index: number) {
		setStudents((prev) => prev.filter((_, i) => i !== index));
	}

	function updateStudent(
		index: number,
		field: keyof StudentRow,
		value: string,
	) {
		setStudents((prev) =>
			prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!nama.trim()) {
			toast.error("Masukkan nama lengkap");
			return;
		}

		setLoading(true);

		const pRes = await fetch("/api/user-profile", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nama, role: "musyrif" }),
		});

		if (!pRes.ok) {
			toast.error("Gagal menyimpan profil");
			setLoading(false);
			return;
		}

		const validStudents = students.filter((s) => s.nama.trim());
		for (const s of validStudents) {
			await fetch("/api/siswa", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nama: s.nama,
					umur: s.umur ? Number.parseInt(s.umur, 10) : undefined,
					target: Number.parseInt(s.target, 10) || 30,
				}),
			});
		}

		setLoading(false);
		toast.success("Setup selesai!");
		navigate({ to: "/dashboard" });
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6 pb-20 md:pb-6">
			<div className="flex flex-col items-center gap-3 text-center">
				<img
					src="/logo-sijil.svg"
					alt="Sijil"
					className="size-14 rounded-2xl"
				/>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Selamat Datang!</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Mari siapkan hafalan Anda. Isi data diri dan daftar siswa.
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Profile */}
				<div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
					<h3 className="text-lg font-semibold">Data Diri</h3>
					<div className="space-y-2">
						<label className="text-sm font-medium">Nama Lengkap</label>
						<Input
							type="text"
							value={nama}
							onChange={(e) => setNama(e.target.value)}
							placeholder="Ustadz/Ustadzah Ahmad"
							required
						/>
					</div>
				</div>

				{/* Students */}
				<div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Daftar Siswa</h3>
						<button
							type="button"
							onClick={addStudentRow}
							className="text-sm font-medium text-primary hover:underline"
						>
							+ Tambah Siswa
						</button>
					</div>

					<div className="space-y-3">
						{students.map((s, i) => (
							<div
								key={i}
								className="grid gap-3 rounded-xl bg-muted/50 p-3 sm:grid-cols-[1fr_80px_80px_32px]"
							>
								<Input
									type="text"
									value={s.nama}
									onChange={(e) => updateStudent(i, "nama", e.target.value)}
									placeholder="Nama siswa"
								/>
								<Input
									type="number"
									value={s.umur}
									onChange={(e) => updateStudent(i, "umur", e.target.value)}
									placeholder="Umur"
								/>
								<Input
									type="number"
									value={s.target}
									onChange={(e) => updateStudent(i, "target", e.target.value)}
									placeholder="Target"
								/>
								{students.length > 1 && (
									<button
										type="button"
										onClick={() => removeStudentRow(i)}
										className="flex items-center justify-center text-destructive hover:text-destructive/80"
									>
										✕
									</button>
								)}
							</div>
						))}
					</div>
				</div>

				<Button type="submit" disabled={loading} className="w-full">
					{loading ? "Menyimpan..." : "Mulai Gunakan Aplikasi"}
				</Button>
			</form>
		</div>
	);
}
