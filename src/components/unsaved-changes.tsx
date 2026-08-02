import { useBlocker } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export function UnsavedChangesGuard({ dirty }: { dirty: boolean }) {
	const blocker = useBlocker({
		shouldBlockFn: () => dirty,
		enableBeforeUnload: () => dirty,
		withResolver: true,
	});

	const blocked = blocker.status === "blocked";

	return (
		<Dialog
			open={blocked}
			onOpenChange={(open) => {
				if (!open && blocker.status === "blocked") blocker.reset();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Perubahan belum disimpan</DialogTitle>
					<DialogDescription>
						Anda memiliki perubahan yang belum disimpan. Tinggalkan halaman ini?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => blocker.status === "blocked" && blocker.reset()}
					>
						Tetap di halaman
					</Button>
					<Button
						variant="destructive"
						onClick={() => blocker.status === "blocked" && blocker.proceed()}
					>
						Tinggalkan halaman
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
