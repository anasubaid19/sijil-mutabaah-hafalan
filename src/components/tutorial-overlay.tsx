import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STEPS = [
	{
		title: "Selamat Datang!",
		text: "Ini adalah Dashboard untuk melihat ringkasan hafalan siswa.",
		navId: "nav-dashboard",
	},
	{
		title: "Ziyadah",
		text: "Klik di sini untuk menambah hafalan baru (ziyadah).",
		navId: "nav-ziyadah",
	},
	{
		title: "Murajaah",
		text: "Review dan catat murajaah siswa di sini.",
		navId: "nav-murajaah",
	},
	{
		title: "Laporan",
		text: "Lihat laporan lengkap dan statistik hafalan.",
		navId: "nav-laporan",
	},
	{
		title: "Manajemen Data",
		text: "Kelola data siswa dan pengaturan profil musyrif.",
		navId: "nav-manajemen",
	},
	{
		title: "Selesai!",
		text: "Tutorial selesai. Jelajahi aplikasi dengan mudah!",
		navId: null,
	},
] as const;

function getTargetRect(navId: string | null): DOMRect | null {
	if (!navId) return null;
	const el = document.querySelector(`[data-nav-id="${navId}"]`);
	if (!el) return null;
	return el.getBoundingClientRect();
}

export function TutorialOverlay() {
	const [step, setStep] = useState(0);
	const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
	const bubbleRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const current = STEPS[step];
		if (!current) return;
		const id = current.navId;

		let retries = 0;
		function tryFind() {
			const rect = getTargetRect(id);
			if (rect || retries > 10) {
				setTargetRect(rect);
			} else {
				retries++;
				requestAnimationFrame(tryFind);
			}
		}
		const timer = setTimeout(tryFind, 80);
		return () => clearTimeout(timer);
	}, [step]);

	function handleNext() {
		if (step < STEPS.length - 1) {
			setStep(step + 1);
		} else {
			done();
		}
	}

	function done() {
		localStorage.setItem("sijil_tutorial_done", "1");
		const el = document.getElementById("sijil-tutorial-root");
		if (el) el.remove();
	}

	const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
	const bubblePos = targetRect
		? isDesktop
			? {
					left: targetRect.right + 12,
					top: Math.max(
						8,
						Math.min(targetRect.top - 20, window.innerHeight - 200),
					),
				}
			: { left: 16, bottom: 100 }
		: isDesktop
			? { left: 300, top: 200 }
			: { left: 16, bottom: 100 };

	return (
		<div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/40"
				aria-label="Tutup tutorial"
				onClick={handleNext}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") handleNext();
				}}
			/>

			{targetRect && (
				<div
					className="absolute rounded-xl ring-4 ring-primary/60 pointer-events-none transition-all duration-300"
					style={{
						left: targetRect.left - 6,
						top: targetRect.top - 6,
						width: targetRect.width + 12,
						height: targetRect.height + 12,
					}}
				/>
			)}

			<div
				ref={bubbleRef}
				className="relative z-10 w-[calc(100vw-32px)] max-w-sm rounded-2xl border bg-card p-5 shadow-xl"
				style={bubblePos as React.CSSProperties}
			>
				<button
					type="button"
					onClick={done}
					className="absolute right-3 top-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
				>
					<X className="w-4 h-4" />
				</button>

				<p className="mb-1 text-xs font-medium text-primary">
					Langkah {step + 1} dari {STEPS.length}
				</p>
				<h3 className="mb-1 text-base font-semibold">{STEPS[step]?.title}</h3>
				<p className="mb-4 text-sm leading-relaxed text-muted-foreground">
					{STEPS[step]?.text}
				</p>

				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={done}
						className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
					>
						Skip tutorial
					</button>
					<button
						type="button"
						onClick={handleNext}
						className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						{step < STEPS.length - 1 ? "Selanjutnya" : "Selesai"}
					</button>
				</div>
			</div>
		</div>
	);
}
