import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface KitabPdfDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	nama: string;
	file: string;
}

export function KitabPdfDialog({
	open,
	onOpenChange,
	nama,
	file,
}: KitabPdfDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>{nama}</DialogTitle>
				</DialogHeader>

				<div className="flex-1 min-h-0 rounded-xl border bg-muted/30 overflow-hidden">
					<iframe src={file} className="w-full h-full" title={nama} />
				</div>

				<div className="flex justify-end pt-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Tutup
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}