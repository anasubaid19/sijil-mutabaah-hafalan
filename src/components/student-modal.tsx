import { useState } from "react";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { calcProgress, getSurahName } from "@/lib/progress";
import { localMonthString } from "@/lib/utils";

interface Siswa {
	id: string;
	nama: string;
	hafalan: number;
	target: number;
	mulaiHafalan?: string | null;
	metodeProgress?: string;
}

interface Setoran {
	id: string;
	siswaId: string;
	type: string;
	tanggal: string;
	surah: number;
	ayatAwal: number;
	ayatAkhir: number;
	status: string;
	catatan?: string;
	isMutqin?: boolean;
}

interface StudentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	siswa: Siswa | null;
	setoranList: Setoran[];
}

const STATUS_COLORS: Record<string, string> = {
	Lancar: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
	"Mulai Lancar": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
	"Tidak Lancar": "bg-red-500/15 text-red-700 dark:text-red-400",
};

const AVATAR_COLORS: Record<string, string[]> = {
	a: ["#f0fdf4", "#166534"],
	b: ["#eff6ff", "#1e40af"],
	c: ["#fefce8", "#854d0e"],
};

function getAvatarColors(n: string): [string, string] {
	return (
		(AVATAR_COLORS[(n[0] || "a").toLowerCase()] as [string, string]) || [
			"#f0fdf4",
			"#1a5c5c",
		]
	);
}

export function StudentModal({
	open,
	onOpenChange,
	siswa,
	setoranList,
}: StudentModalProps) {
	const [previewOpen, setPreviewOpen] = useState(false);
	const defaultMonth = localMonthString();
	const [exportPeriode, setExportPeriode] = useState(defaultMonth);

	if (!siswa) return null;

	const recs = setoranList.filter((r) => r.siswaId === siswa.id);
	const p = calcProgress(siswa, recs);
	const [bg, fg] = getAvatarColors(siswa.nama);
	const initials = siswa.nama
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{siswa.nama}</DialogTitle>
				</DialogHeader>

				<div className="flex items-center gap-4">
					<div
						className="flex size-14 items-center justify-center rounded-full text-lg font-bold"
						style={{ background: bg, color: fg }}
					>
						{initials}
					</div>
					<div className="flex-1">
						<p className="text-sm text-muted-foreground">
							{recs.length} setoran &middot; {p.pct}% {p.unit}
						</p>
						<div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary transition-all"
								style={{ width: `${Math.min(p.pct, 100)}%` }}
							/>
						</div>
					</div>
				</div>

				<div className="max-h-64 space-y-2 overflow-y-auto pt-2">
					{recs.length === 0 ? (
						<p className="py-4 text-center text-sm text-muted-foreground">
							Belum ada setoran
						</p>
					) : (
						recs
							.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
							.map((r) => (
								<div
									key={r.id}
									className="flex items-center justify-between rounded-xl border p-3"
								>
									<div>
										<p className="text-sm font-semibold">
											{getSurahName(r.surah)} ({r.ayatAwal}-{r.ayatAkhir})
										</p>
										<p className="text-xs text-muted-foreground">
											{r.type} &middot;{" "}
											{new Date(`${r.tanggal}T00:00:00`).toLocaleDateString(
												"id-ID",
												{
													day: "numeric",
													month: "short",
												},
											)}
										</p>
									</div>
									<span
										className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
											STATUS_COLORS[r.status] ?? ""
										}`}
									>
										{r.status}
									</span>
								</div>
							))
					)}
				</div>

				{siswa && (
					<div className="mt-2 space-y-2">
						<label
							htmlFor="siswa-export-periode"
							className="text-xs text-muted-foreground"
						>
							Bulan / Periode
						</label>
						<input
							id="siswa-export-periode"
							type="month"
							value={exportPeriode}
							onChange={(e) => setExportPeriode(e.target.value)}
							className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors"
						/>
						<button
							type="button"
							onClick={() => setPreviewOpen(true)}
							className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							Export PDF
						</button>
					</div>
				)}
			</DialogContent>

			<PdfPreviewDialog
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				payload={{ type: "siswa", siswaId: siswa?.id, periode: exportPeriode }}
				filename={`Rapor_${(siswa?.nama ?? "").replace(/\s+/g, "_")}.pdf`}
			/>
		</Dialog>
	);
}
