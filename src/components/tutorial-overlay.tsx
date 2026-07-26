import { Cancel } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

const GAP = 20;
const CALLOUT_W = 300;
const MIN_CALLOUT_H = 160;

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
		text: "Kelola data siswa dan update profil musyrif kapan saja di sini.",
		navId: "nav-manajemen",
	},
	{
		title: "Selesai!",
		text: "Tutorial selesai! Jelajahi aplikasi dan kelola data kapan saja di Manajemen Data.",
		navId: null,
	},
] as const;

type Placement = {
	side: "right" | "bottom" | "top" | "left" | "bottom-sheet" | "center";
	x: number;
	y: number;
};

function getTargetRect(navId: string | null): DOMRect | null {
	if (!navId) return null;
	const el = document.querySelector(`[data-nav-id="${navId}"]`);
	return el ? el.getBoundingClientRect() : null;
}

function calcPlacement(
	target: DOMRect | null,
	isMobile: boolean,
): Placement | null {
	const w = window.innerWidth;
	const h = window.innerHeight;

	if (isMobile) {
		return {
			side: "bottom-sheet",
			x: 0,
			y: 0,
		};
	}

	if (!target) {
		return {
			side: "center",
			x: (w - CALLOUT_W) / 2,
			y: Math.max(40, (h - MIN_CALLOUT_H) / 2),
		};
	}

	const spaceRight = w - target.right - GAP;
	const spaceBelow = h - target.bottom - GAP;
	const spaceAbove = target.top - GAP;
	const spaceLeft = target.left - GAP;
	const targetCX = target.left + target.width / 2;

	if (spaceRight >= CALLOUT_W) {
		return {
			side: "right",
			x: target.right + GAP,
			y: Math.max(12, Math.min(target.top - 10, h - MIN_CALLOUT_H - 12)),
		};
	}

	if (spaceBelow >= MIN_CALLOUT_H) {
		return {
			side: "bottom",
			x: Math.max(12, Math.min(targetCX - CALLOUT_W / 2, w - CALLOUT_W - 12)),
			y: target.bottom + GAP,
		};
	}

	if (spaceAbove >= MIN_CALLOUT_H) {
		return {
			side: "top",
			x: Math.max(12, Math.min(targetCX - CALLOUT_W / 2, w - CALLOUT_W - 12)),
			y: target.top - GAP - MIN_CALLOUT_H,
		};
	}

	if (spaceLeft >= CALLOUT_W) {
		return {
			side: "left",
			x: target.left - GAP - CALLOUT_W,
			y: Math.max(12, Math.min(target.top - 10, h - MIN_CALLOUT_H - 12)),
		};
	}

	return {
		side: "bottom-sheet",
		x: 0,
		y: 0,
	};
}

function arrowStyle(side: Placement["side"]): React.CSSProperties | null {
	if (side === "right") {
		return {
			left: -8,
			top: 24,
			borderTop: "7px solid transparent",
			borderBottom: "7px solid transparent",
			borderRight: "9px solid hsl(var(--card))",
		};
	}
	if (side === "left") {
		return {
			right: -8,
			top: 24,
			borderTop: "7px solid transparent",
			borderBottom: "7px solid transparent",
			borderLeft: "9px solid hsl(var(--card))",
		};
	}
	if (side === "bottom") {
		return {
			left: 32,
			top: -8,
			borderLeft: "7px solid transparent",
			borderRight: "7px solid transparent",
			borderBottom: "9px solid hsl(var(--card))",
		};
	}
	if (side === "top") {
		return {
			left: 32,
			bottom: -8,
			borderLeft: "7px solid transparent",
			borderRight: "7px solid transparent",
			borderTop: "9px solid hsl(var(--card))",
		};
	}
	return null;
}

export function TutorialOverlay({ onFinish }: { onFinish: () => void }) {
	const [step, setStep] = useState(0);
	const [target, setTarget] = useState<DOMRect | null>(null);
	const [anim, setAnim] = useState<"in" | "out">("in");
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" && window.innerWidth < 768,
	);
	const stepRef = useRef(step);
	stepRef.current = step;

	const current = STEPS[step];
	const placement = calcPlacement(
		current.navId !== null ? target : null,
		isMobile,
	);
	const showSpotlight = !isMobile && target !== null && current.navId !== null;
	const showBackdrop = isMobile || (!showSpotlight && current.navId !== null);

	useEffect(() => {
		function onResize() {
			setIsMobile(window.innerWidth < 768);
			const id = STEPS[stepRef.current]?.navId;
			if (id) setTarget(getTargetRect(id));
		}
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	useEffect(() => {
		const id = current?.navId;
		let retries = 0;
		setAnim("out");

		const t1 = setTimeout(() => {
			function tryFind() {
				const rect = getTargetRect(id);
				if (rect || !id || retries > 10) {
					setTarget(rect);
					setAnim("in");
				} else {
					retries++;
					requestAnimationFrame(tryFind);
				}
			}
			if (id && !isMobile) {
				tryFind();
			} else {
				setTarget(null);
				setAnim("in");
			}
		}, 220);

		return () => clearTimeout(t1);
	}, [current?.navId, isMobile]);

	function next() {
		if (step < STEPS.length - 1) {
			setStep(step + 1);
		} else {
			localStorage.setItem("sijil_tutorial_done", "1");
			onFinish();
		}
	}

	function done() {
		localStorage.setItem("sijil_tutorial_done", "1");
		onFinish();
	}

	const arrowDir = arrowStyle(placement?.side ?? "");

	return (
		<div className="fixed inset-0 z-[9999]">
			{/* Backdrop */}
			{showBackdrop && (
				<button
					type="button"
					className="absolute inset-0 bg-black/45 z-[1]"
					aria-label="Lanjutkan tutorial"
					onClick={next}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") next();
					}}
				/>
			)}

			{/* Desktop: spotlight with box-shadow cutout */}
			{showSpotlight && target && (
				<div
					className="absolute pointer-events-none"
					style={{
						left: target.left - 8,
						top: target.top - 8,
						width: target.width + 16,
						height: target.height + 16,
						borderRadius: 16,
						boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
						transition: "all 300ms ease-out",
						zIndex: 2,
					}}
				/>
			)}

			{/* Desktop: glow ring */}
			{showSpotlight && target && (
				<div
					className="absolute pointer-events-none"
					style={{
						left: target.left - 5,
						top: target.top - 5,
						width: target.width + 10,
						height: target.height + 10,
						borderRadius: 14,
						border: "3px solid hsl(var(--primary) / 0.5)",
						boxShadow:
							"0 0 14px 3px hsl(var(--primary) / 0.25), inset 0 0 14px 3px hsl(var(--primary) / 0.1)",
						transition: "all 300ms ease-out",
						zIndex: 3,
					}}
				/>
			)}

			{/* Callout card */}
			{placement && (
				<div
					className={`absolute z-[4] max-w-[300px] w-[calc(100vw-24px)] rounded-2xl border bg-card p-5 shadow-xl transition-all duration-300 ease-out ${
						anim === "in"
							? "opacity-100 translate-y-0"
							: "opacity-0 translate-y-2"
					}`}
					style={{
						left: isMobile ? 12 : placement.x,
						top:
							isMobile || placement.side === "bottom-sheet"
								? "auto"
								: placement.y,
						bottom: isMobile || placement.side === "bottom-sheet" ? 24 : "auto",
						borderRadius:
							isMobile || placement.side === "bottom-sheet"
								? "var(--radius) var(--radius) var(--radius) var(--radius)"
								: undefined,
					}}
				>
					{/* Pointer arrow (desktop only) */}
					{!isMobile && arrowDir && (
						<div
							className="absolute"
							style={{
								width: 0,
								height: 0,
								...arrowDir,
							}}
						/>
					)}

					{/* Close */}
					<button
						type="button"
						onClick={done}
						className="absolute right-3 top-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
					>
						<HugeiconsIcon icon={Cancel} className="w-4 h-4" />
					</button>

					{/* Step counter */}
					<p className="mb-1 text-xs font-medium text-primary">
						Langkah {step + 1} dari {STEPS.length}
					</p>
					<h3 className="mb-1 text-base font-semibold">{current?.title}</h3>
					<p className="mb-4 text-sm leading-relaxed text-muted-foreground">
						{current?.text}
					</p>

					{/* Buttons */}
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={done}
							className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors min-h-[44px] px-2"
						>
							Skip tutorial
						</button>
						<button
							type="button"
							onClick={next}
							className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
						>
							{step < STEPS.length - 1 ? "Selanjutnya" : "Selesai"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
