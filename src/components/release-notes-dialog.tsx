import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { LATEST_RELEASE } from "@/lib/release-notes";

const STORAGE_PREFIX = "sijil_release_seen_";

export function ReleaseNotesDialog() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const release = LATEST_RELEASE;
		if (!release) return;
		if (localStorage.getItem(STORAGE_PREFIX + release.id)) return;
		setOpen(true);
	}, []);

	function acknowledge() {
		if (LATEST_RELEASE) {
			localStorage.setItem(STORAGE_PREFIX + LATEST_RELEASE.id, "1");
		}
		setOpen(false);
	}

	if (!LATEST_RELEASE) return null;

	return (
		<Dialog open={open} onOpenChange={(o) => (o ? void 0 : acknowledge())}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{LATEST_RELEASE.title}</DialogTitle>
					<DialogDescription
						render={<div />}
						className="text-foreground"
					>
						<ul className="mt-2 list-disc space-y-1.5 ps-5">
							{LATEST_RELEASE.items.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</DialogDescription>
				</DialogHeader>
				<Button onClick={acknowledge} className="w-full">
					Mengerti
				</Button>
			</DialogContent>
		</Dialog>
	);
}
