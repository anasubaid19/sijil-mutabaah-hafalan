import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const KATEGORI = ["Bug", "Saran", "Lainnya"];

export function ReportDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [kategori, setKategori] = useState("Bug");
	const [pesan, setPesan] = useState("");
	const [sending, setSending] = useState(false);

	async function submit() {
		if (!pesan.trim()) {
			toast.error("Tulis pesan laporan dulu");
			return;
		}
		setSending(true);
		try {
			const res = await fetch("/api/bug-report", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ kategori, pesan }),
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok) {
				toast.success("Laporan terkirim! Terima kasih atas masukannya.");
				setPesan("");
				setKategori("Bug");
				onOpenChange(false);
			} else {
				toast.error(data.error || "Gagal mengirim laporan");
			}
		} catch {
			toast.error("Gagal mengirim laporan");
		}
		setSending(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Laporkan Masalah</DialogTitle>
					<DialogDescription>
						Ceritakan bug atau saran kamu — laporan langsung masuk ke pengelola.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-1">
						<label className="text-sm font-medium">Kategori</label>
						<Select value={kategori} onValueChange={(v) => v && setKategori(v)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{KATEGORI.map((k) => (
									<SelectItem key={k} value={k}>
										{k}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium">Pesan</label>
						<Textarea
							value={pesan}
							onChange={(e) => setPesan(e.target.value)}
							maxLength={2000}
							rows={5}
							placeholder="Jelaskan masalah atau sarannya..."
						/>
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Batal
					</Button>
					<Button onClick={submit} disabled={sending}>
						{sending ? "Mengirim..." : "Kirim Laporan"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
