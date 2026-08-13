import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SubmissionSuccessOptions {
	studentName: string;
	onNext: () => void;
	onMurajaah: () => void;
	onReport: () => void;
}

export function showSubmissionSuccess({
	studentName,
	onNext,
	onMurajaah,
	onReport,
}: SubmissionSuccessOptions) {
	toast.custom(
		(id) => (
			<div className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl border bg-popover p-4 text-popover-foreground shadow-lg">
				<div className="flex items-start gap-3">
					<HugeiconsIcon
						icon={CheckmarkCircle02Icon}
						className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
						aria-hidden
					/>
					<div className="min-w-0">
						<p className="text-sm font-semibold">
							Setoran {studentName} berhasil disimpan
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Pilih langkah berikutnya.
						</p>
					</div>
				</div>
				<div className="mt-3 flex flex-wrap gap-2">
					<Button
						size="xs"
						onClick={() => {
							toast.dismiss(id);
							onNext();
						}}
					>
						Input Setoran Berikutnya
					</Button>
					<Button
						size="xs"
						variant="outline"
						onClick={() => {
							toast.dismiss(id);
							onMurajaah();
						}}
					>
						Input Murajaah
					</Button>
					<Button
						size="xs"
						variant="ghost"
						onClick={() => {
							toast.dismiss(id);
							onReport();
						}}
					>
						Lihat Laporan Siswa
					</Button>
				</div>
			</div>
		),
		{ duration: Number.POSITIVE_INFINITY },
	);
}
