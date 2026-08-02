import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SURAH_DATA } from "@/lib/surah-data";

export interface Siswa {
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

interface StudentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingSiswa: Siswa | null;
	onSaved: () => void;
}

const selectClass =
	"pointer-coarse:min-h-11 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors md:text-sm";

export function StudentDialog({
	open,
	onOpenChange,
	editingSiswa,
	onSaved,
}: StudentDialogProps) {
	const [nama, setNama] = useState("");
	const [umur, setUmur] = useState("");
	const [metode, setMetode] = useState<"juz" | "surah">("juz");
	const [targetFrom, setTargetFrom] = useState("1");
	const [targetTo, setTargetTo] = useState("30");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open) return;
		if (editingSiswa) {
			setNama(editingSiswa.nama);
			setUmur(editingSiswa.umur?.toString() || "");
			const m = (editingSiswa.metodeProgress === "surah" ? "surah" : "juz") as
				| "juz"
				| "surah";
			setMetode(m);
			if (m === "surah") {
				const fromSurah = SURAH_DATA.find(
					(sd) => sd.name === editingSiswa.mulaiHafalan,
				);
				const toSurah = SURAH_DATA.find(
					(sd) => sd.number === editingSiswa.target,
				);
				setTargetFrom(fromSurah?.number.toString() || "1");
				setTargetTo(toSurah?.number.toString() || "114");
			} else {
				setTargetFrom(editingSiswa.mulaiHafalan || "1");
				setTargetTo(editingSiswa.target.toString());
			}
		} else {
			setNama("");
			setUmur("");
			setMetode("juz");
			setTargetFrom("1");
			setTargetTo("30");
		}
	}, [open, editingSiswa]);

	function handleMetode(v: "juz" | "surah") {
		setMetode(v);
		setTargetFrom("1");
		setTargetTo(v === "juz" ? "30" : "114");
	}

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!nama.trim()) return;
		setSaving(true);
		const from =
			metode === "juz"
				? targetFrom
				: SURAH_DATA.find((s) => s.number === Number.parseInt(targetFrom, 10))
						?.name || "Al-Fatihah";

		const payload: Record<string, unknown> = {
			nama: nama.trim(),
			umur: umur ? Number.parseInt(umur, 10) : undefined,
			mulaiHafalan: from,
			target: Number.parseInt(targetTo, 10) || 30,
			metodeProgress: metode,
		};

		try {
			if (editingSiswa) {
				const res = await fetch("/api/siswa", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ...payload, id: editingSiswa.id }),
				});
				if (!res.ok) throw new Error("update");
				toast.success("Siswa diperbarui!");
			} else {
				const res = await fetch("/api/siswa", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				if (!res.ok) throw new Error("create");
				toast.success("Siswa ditambahkan!");
			}
			onOpenChange(false);
			onSaved();
		} catch {
			toast.error("Gagal menyimpan siswa");
		}
		setSaving(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{editingSiswa ? "Edit Siswa" : "Tambah Siswa"}
					</DialogTitle>
					<DialogDescription>
						Data identitas dan target hafalan siswa.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="space-y-4">
					<div className="grid gap-3 sm:grid-cols-3">
						<div className="space-y-1 sm:col-span-2">
							<label htmlFor="dialog-nama" className="text-sm font-medium">
								Nama
							</label>
							<Input
								id="dialog-nama"
								type="text"
								value={nama}
								onChange={(e) => setNama(e.target.value)}
								placeholder="Nama siswa"
								required
							/>
						</div>
						<div className="space-y-1">
							<label htmlFor="dialog-umur" className="text-sm font-medium">
								Umur
							</label>
							<Input
								id="dialog-umur"
								type="number"
								value={umur}
								onChange={(e) => setUmur(e.target.value)}
								placeholder="7"
							/>
						</div>
					</div>
					<div className="grid gap-3 sm:grid-cols-3">
						<div className="space-y-1">
							<label htmlFor="dialog-metode" className="text-sm font-medium">
								Metode
							</label>
							<select
								id="dialog-metode"
								value={metode}
								onChange={(e) =>
									handleMetode(e.target.value as "juz" | "surah")
								}
								className={selectClass}
							>
								<option value="juz">Per Juz</option>
								<option value="surah">Per Surah</option>
							</select>
						</div>
						<div className="space-y-1">
							<label htmlFor="dialog-from" className="text-sm font-medium">
								{metode === "juz" ? "Mulai Juz" : "Mulai Surah"}
							</label>
							{metode === "juz" ? (
								<select
									id="dialog-from"
									value={targetFrom}
									onChange={(e) => setTargetFrom(e.target.value)}
									className={selectClass}
								>
									{Array.from({ length: 30 }, (_, i) => (
										<option key={i + 1} value={i + 1}>
											Juz {i + 1}
										</option>
									))}
								</select>
							) : (
								<select
									id="dialog-from"
									value={targetFrom}
									onChange={(e) => setTargetFrom(e.target.value)}
									className={selectClass}
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
							<label htmlFor="dialog-to" className="text-sm font-medium">
								{metode === "juz" ? "Sampai Juz" : "Sampai Surah"}
							</label>
							{metode === "juz" ? (
								<select
									id="dialog-to"
									value={targetTo}
									onChange={(e) => setTargetTo(e.target.value)}
									className={selectClass}
								>
									{Array.from({ length: 30 }, (_, i) => (
										<option key={i + 1} value={i + 1}>
											Juz {i + 1}
										</option>
									))}
								</select>
							) : (
								<select
									id="dialog-to"
									value={targetTo}
									onChange={(e) => setTargetTo(e.target.value)}
									className={selectClass}
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
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button type="submit" disabled={saving}>
							{saving
								? "Menyimpan..."
								: editingSiswa
									? "Simpan Perubahan"
									: "Tambah Siswa"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
