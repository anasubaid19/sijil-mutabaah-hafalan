import { toast } from "sonner";
import type { Siswa } from "@/components/student-dialog";
import { Button } from "@/components/ui/button";

interface StudentListProps {
	siswaList: Siswa[];
	onEdit: (s: Siswa) => void;
	onDelete: (id: string) => void;
	onAdd?: () => void;
}

function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
	toast.success("Disalin ke clipboard!");
}

export function StudentList({
	siswaList,
	onEdit,
	onDelete,
	onAdd,
}: StudentListProps) {
	if (siswaList.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 py-8 text-center">
				<p className="text-sm font-medium text-foreground">Belum ada siswa</p>
				<p className="max-w-xs text-xs text-muted-foreground">
					Tambahkan siswa pertama untuk mulai mencatat target hafalan mereka.
				</p>
				{onAdd && (
					<Button className="pointer-coarse:min-h-11" onClick={onAdd}>
						Tambah Siswa
					</Button>
				)}
			</div>
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
									className="pointer-coarse:min-h-11 rounded-lg px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
								>
									Edit
								</button>
								<button
									type="button"
									onClick={() => onDelete(s.id)}
									className="pointer-coarse:min-h-11 rounded-lg px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10"
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
									className="pointer-coarse:min-h-11 ml-auto text-primary hover:underline"
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
