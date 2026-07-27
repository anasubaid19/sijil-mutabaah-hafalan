import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface PdfPreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** API endpoint URL */
	endpoint?: string;
	/** API request payload */
	payload: Record<string, unknown>;
	/** Suggested download filename */
	filename: string;
}

export function PdfPreviewDialog({
	open,
	onOpenChange,
	endpoint = "/api/export-pdf",
	payload,
	filename,
}: PdfPreviewDialogProps) {
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const generate = useCallback(async () => {
		setLoading(true);
		setPdfUrl(null);
		try {
			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("Gagal generate PDF");
			const blob = await res.blob();
			setPdfUrl(URL.createObjectURL(blob));
		} catch {
			toast.error("Gagal generate PDF");
		} finally {
			setLoading(false);
		}
	}, [endpoint, payload]);

	useEffect(() => {
		if (open) generate();
	}, [open, generate]);

	// Cleanup blob URL on unmount
	useEffect(() => {
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl);
		};
	}, [pdfUrl]);

	function download() {
		if (!pdfUrl) return;
		const a = document.createElement("a");
		a.href = pdfUrl;
		a.download = filename;
		a.click();
		toast.success("PDF diunduh!");
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Preview PDF</DialogTitle>
				</DialogHeader>

				<div className="flex-1 min-h-0 rounded-xl border bg-muted/30 overflow-hidden">
					{loading ? (
						<div className="flex h-full items-center justify-center">
							<div className="text-sm text-muted-foreground">
								Menghasilkan PDF...
							</div>
						</div>
					) : pdfUrl ? (
						<iframe
							src={pdfUrl}
							className="w-full h-full"
							title="PDF Preview"
						/>
					) : null}
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Tutup
					</Button>
					<Button onClick={download} disabled={!pdfUrl}>
						<HugeiconsIcon icon={Download01Icon} className="w-4 h-4 mr-1.5" />
						Download
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
