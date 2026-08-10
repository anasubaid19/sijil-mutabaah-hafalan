import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { localDateString } from "@/lib/utils";

interface Siswa {
	id: string;
	nama: string;
}

type Preset =
	| "this-month"
	| "last-month"
	| "last-3"
	| "last-6"
	| "this-year"
	| "custom";

const PRESETS: { key: Preset; label: string }[] = [
	{ key: "this-month", label: "Bulan Ini" },
	{ key: "last-month", label: "Bulan Lalu" },
	{ key: "last-3", label: "3 Bulan" },
	{ key: "last-6", label: "6 Bulan" },
	{ key: "this-year", label: "Tahun Ini" },
	{ key: "custom", label: "Kustom" },
];

function today() {
	return localDateString();
}

function presetRange(preset: Preset): { awal: string; akhir: string } {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();

	switch (preset) {
		case "this-month": {
			const first = new Date(y, m, 1);
			const last = new Date(y, m + 1, 0);
			return { awal: fmt(first), akhir: fmt(last) };
		}
		case "last-month": {
			const first = new Date(y, m - 1, 1);
			const last = new Date(y, m, 0);
			return { awal: fmt(first), akhir: fmt(last) };
		}
		case "last-3": {
			const first = new Date(y, m - 2, 1);
			return { awal: fmt(first), akhir: today() };
		}
		case "last-6": {
			const first = new Date(y, m - 5, 1);
			return { awal: fmt(first), akhir: today() };
		}
		case "this-year": {
			return { awal: `${y}-01-01`, akhir: today() };
		}
		default:
			return { awal: "", akhir: "" };
	}
}

function fmt(d: Date): string {
	return localDateString(d);
}

// Future: add format selection here
// const FORMATS = ["pdf", "csv", "xlsx"] as const;

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PresensiExportDialog({ open, onOpenChange }: Props) {
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [preset, setPreset] = useState<Preset>("this-month");
	const [tanggalAwal, setTanggalAwal] = useState("");
	const [tanggalAkhir, setTanggalAkhir] = useState("");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [previewOpen, setPreviewOpen] = useState(false);
	const [exportPayload, setExportPayload] = useState<{
		tanggalAwal: string;
		tanggalAkhir: string;
		siswaIds: string[];
	} | null>(null);

	const allSelected =
		siswaList.length > 0 && selectedIds.size === siswaList.length;

	useEffect(() => {
		fetch("/api/siswa")
			.then((r) => (r.ok ? r.json() : []))
			.then((list: Siswa[]) => {
				setSiswaList(list);
				setSelectedIds(new Set(list.map((s) => s.id)));
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		const range = presetRange(preset);
		setTanggalAwal(range.awal);
		setTanggalAkhir(range.akhir);
	}, [preset]);

	function toggleAll() {
		setSelectedIds(
			allSelected ? new Set() : new Set(siswaList.map((s) => s.id)),
		);
	}

	function toggleSiswa(id: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function exportPdf() {
		const ids = Array.from(selectedIds);
		if (ids.length === 0 || !tanggalAwal || !tanggalAkhir) {
			toast.error("Pilih periode dan minimal satu siswa");
			return;
		}
		setExportPayload({ tanggalAwal, tanggalAkhir, siswaIds: ids });
		setPreviewOpen(true);
	}

	const isValid = selectedIds.size > 0 && tanggalAwal && tanggalAkhir;

	const filename = `Presensi_${tanggalAwal}_${tanggalAkhir}.pdf`;

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Export Laporan Presensi</DialogTitle>
					</DialogHeader>

					<div className="space-y-5">
						{/* Period Presets */}
						<div className="space-y-2">
							<label className="text-sm font-medium">Periode</label>
							<div className="flex flex-wrap gap-1.5">
								{PRESETS.map((p) => (
									<button
										key={p.key}
										type="button"
										onClick={() => setPreset(p.key)}
										className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
											preset === p.key
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground hover:bg-muted/80"
										}`}
									>
										{p.label}
									</button>
								))}
							</div>
						</div>

						{/* Custom Date Range */}
						{preset === "custom" && (
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-medium">Dari</label>
									<Input
										type="date"
										value={tanggalAwal}
										onChange={(e) => setTanggalAwal(e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium">Sampai</label>
									<Input
										type="date"
										value={tanggalAkhir}
										onChange={(e) => setTanggalAkhir(e.target.value)}
									/>
								</div>
							</div>
						)}

						{/* Students */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Siswa ({selectedIds.size}/{siswaList.length})
							</label>
							<div className="space-y-1 max-h-48 overflow-y-auto rounded-xl border bg-muted/30 p-2">
								<label className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-muted/50">
									<Checkbox
										checked={allSelected}
										onCheckedChange={() => toggleAll()}
									/>
									<span className="text-sm font-medium">Semua Siswa</span>
								</label>
								{siswaList.map((s) => (
									<label
										key={s.id}
										className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-muted/50"
									>
										<Checkbox
											checked={selectedIds.has(s.id)}
											onCheckedChange={() => toggleSiswa(s.id)}
										/>
										<span className="text-sm">{s.nama}</span>
									</label>
								))}
							</div>
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Batal
						</Button>
						<Button onClick={exportPdf} disabled={!isValid}>
							Export PDF
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{exportPayload && (
				<PdfPreviewDialog
					open={previewOpen}
					onOpenChange={setPreviewOpen}
					endpoint="/api/export-presensi"
					payload={exportPayload}
					filename={filename}
				/>
			)}
		</>
	);
}
