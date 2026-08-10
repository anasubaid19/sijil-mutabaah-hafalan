import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KitabPdfDialog } from "@/components/kitab-pdf-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
			<div>
				<h2 className="text-base font-semibold">Kitab</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Baca kitab-kitab yang dikaji di halaqah.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				{KITAB_LIST.map((k) => (
					<Card key={k.id}>
						<CardContent className="flex flex-col gap-3">
							<div>
								<CardTitle>
									<span className="text-lg font-medium">{k.nama}</span>
								</CardTitle>
								{k.penulis && (
									<p className="mt-1 text-xs text-muted-foreground">
										{k.penulis}
									</p>
								)}
							</div>
							<Button
								variant={k.file ? "default" : "outline"}
								className="w-full"
								onClick={() => openKitab(k)}
							>
								{k.file ? "Baca" : "Sedang dalam pengembangan"}
							</Button>
						</CardContent>
					</Card>
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