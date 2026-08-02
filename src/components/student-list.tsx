import { toast } from "sonner";
import type { Siswa } from "@/components/student-dialog";

interface StudentListProps {
	siswaList: Siswa[];
	onEdit: (s: Siswa) => void;
	onDelete: (id: string) => void;
}

function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
	toast.success("Disalin ke clipboard!");
}

export function StudentList({ siswaList, onEdit, onDelete }: StudentListProps) {
	if (siswaList.length === 0) {
		return (
			<p className="py-4 text-center text-sm text-muted-foreground">
				Belum ada siswa
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{siswaList.map((s) => {
				const pct =
					s.target > 0
						? Math.min(100, Math.round((s.hafalan / s.target) * 100))
						: 0;
				return (
					<div
						key={s.id}
						className="space-y-2 rounded-xl bg-muted/50 px-4 py-3"
					>
						<div className="flex items-center justify-between gap-2">
							<div className="min-w-0">
								<p className="truncate text-sm font-semibold">{s.nama}</p>
								<p className="text-xs text-muted-foreground">
									{s.hafalan}/{s.target}{" "}
									{s.metodeProgress === "surah" ? "surah" : "juz"}
									{s.mulaiHafalan ? ` (dari ${s.mulaiHafalan})` : ""}
									{s.umur ? ` · ${s.umur} tahun` : ""}
								</p>
							</div>
							<div className="flex shrink-0 gap-1">
								<button
									type="button"
									onClick={() => onEdit(s)}
									className="rounded-lg px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
								>
									Edit
								</button>
								<button
									type="button"
									onClick={() => onDelete(s.id)}
									className="rounded-lg px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10"
								>
									Hapus
								</button>
							</div>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/15">
							<div
								className="h-full rounded-full bg-primary"
								style={{ width: `${pct}%` }}
							/>
						</div>
						{s.studentId && (
							<div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs">
								<span className="text-muted-foreground">ID:</span>
								<code className="font-mono font-semibold">{s.studentId}</code>
								<button
									type="button"
									onClick={() => s.studentId && copyToClipboard(s.studentId)}
									className="ml-auto text-primary hover:underline"
								>
									Salin
								</button>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
