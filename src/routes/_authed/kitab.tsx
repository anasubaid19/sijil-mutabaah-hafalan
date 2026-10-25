import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { KitabPdfDialog } from "@/components/kitab-pdf-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { KITAB_LIST, type Kitab } from "@/lib/kitab";

export const Route = createFileRoute("/_authed/kitab")({
	component: KitabPage,
});

function KitabPage() {
	const [selected, setSelected] = useState<Kitab | null>(null);

	function openKitab(k: Kitab) {
		if (k.file) {
			setSelected(k);
		} else {
			toast("Sedang dalam pengembangan");
		}
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6 pb-20 md:pb-6">
			<PageHeader
				title="Kitab"
				subtitle="Baca kitab-kitab yang dikaji di halaqah."
			/>

			<div className="ios-list">
				{KITAB_LIST.map((k) => (
					<button
						key={k.id}
						type="button"
						onClick={() => openKitab(k)}
						className="ios-row tap-row w-full text-left"
					>
						<div className="min-w-0 flex-1">
							<p className="truncate text-[1.0625rem] font-medium tracking-[-0.01em]">
								{k.nama}
							</p>
							{k.penulis && (
								<p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">
									{k.penulis}
								</p>
							)}
						</div>
						{k.file ? (
							<HugeiconsIcon
								icon={ArrowRight}
								strokeWidth={2}
								className="size-4 shrink-0 text-muted-foreground/60"
								aria-hidden
							/>
						) : (
							<span className="shrink-0 text-[0.8125rem] text-muted-foreground">
								Segera
							</span>
						)}
					</button>
				))}
			</div>

			{selected?.file && (
				<KitabPdfDialog
					open
					onOpenChange={() => setSelected(null)}
					nama={selected.nama}
					file={selected.file}
				/>
			)}
		</div>
	);
}