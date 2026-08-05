import {
	AndroidIcon,
	AppleIcon,
	Cancel,
	Monitor,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useRef, useState } from "react";

const GAP = 20;
const CALLOUT_W = 300;
const MIN_CALLOUT_H = 160;

type Platform = "android" | "ios" | "desktop";

type Step = {
	title: string;
	text: string;
	navId: string | null;
	mobileNavId?: string | null;
	variant?: "spotlight" | "center" | "completion";
	platform?: Platform;
	installSteps?: string[];
};

type Placement = {
	side: "right" | "bottom" | "top" | "left" | "bottom-sheet" | "center";
	x: number;
	y: number;
};

type Viewport = { top: number; bottom: number; w: number };

const BASE_STEPS: Step[] = [
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
		text: "Lihat laporan lengkap dan statistik hafalan. Di HP, buka menu Lainnya di bawah.",
		navId: "nav-laporan",
		mobileNavId: "nav-lainnya",
	},
	{
		title: "Manajemen Data",
		text: "Kelola data siswa dan update profil musyrif kapan saja. Di HP, buka menu Lainnya di bawah.",
		navId: "nav-manajemen",
		mobileNavId: "nav-lainnya",
	},
];

const INSTALL_TEXT: Record<Platform, { intro: string; steps: string[] }> = {
	android: {
		intro:
			"Pasang Sijil Mutaba'ah sebagai aplikasi agar bisa dibuka langsung seperti aplikasi biasa.",
		steps: [
			"Ketuk ikon ⋮ (tiga titik) di kanan atas Chrome.",
			'Pilih "Install app" atau "Tambahkan ke layar utama".',
			'Ketuk "Install" untuk konfirmasi.',
		],
	},
	ios: {
		intro:
			"Pasang Sijil Mutaba'ah sebagai aplikasi agar bisa dibuka langsung dari Layar Utama.",
		steps: [
			"Ketuk tombol Bagikan (kotak dengan panah ke atas).",
			'Gulir ke bawah, pilih "Tambahkan ke Layar Utama".',
			'Ketuk "Tambah" di pojok kanan atas.',
		],
	},
	desktop: {
		intro:
			"Pasang Sijil Mutaba'ah sebagai aplikasi agar bisa dibuka lewat ikon desktop.",
		steps: [
			"Klik ikon install (monitor dengan panah) di ujung kanan bilah alamat.",
			'Jika tidak muncul, buka menu ⋮ lalu pilih "Instal Sijil Mutaba\'ah".',
			'Klik "Instal" untuk konfirmasi.',
		],
	},
};

const COMPLETION_STEP: Step = {
	title: "Tutorial Selesai!",
	text: "Selamat! Anda sudah siap menggunakan Sijil Mutaba'ah.",
	navId: null,
	variant: "completion",
};

function detectPlatform(): Platform {
	const ua = navigator.userAgent;
	const isIOS =
		/iPad|iPhone|iPod/.test(ua) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
	if (isIOS) return "ios";
	if (/Android/.test(ua)) return "android";
	return "desktop";
}

function isStandalone(): boolean {
	return (
		window.matchMedia?.("(display-mode: standalone)").matches ||
		(navigator as unknown as { standalone?: boolean }).standalone === true
	);
}

function getTargetRect(navId: string | null): DOMRect | null {
	if (!navId) return null;
	const el = document.querySelector(`[data-nav-id="${navId}"]`);
	return el ? el.getBoundingClientRect() : null;
}

function getViewport(): Viewport {
	const w = window.innerWidth;
	let top = 0;
	let bottom = window.innerHeight;
	if (window.visualViewport) {
		top = window.visualViewport.offsetTop;
		bottom = top + window.visualViewport.height;
	}
	const nav = document.querySelector("[data-bottom-nav]");
	const navRect = nav?.getBoundingClientRect();
	const navTop =
		navRect && navRect.width > 0 && navRect.height > 0
			? navRect.top
			: undefined;
	if (navTop !== undefined && navTop < bottom - 8) bottom = navTop;
	top = Math.min(top + 8, bottom - MIN_CALLOUT_H);
	bottom = Math.max(bottom - 8, top + MIN_CALLOUT_H);
	return { top, bottom, w };
}

function calcPlacement(
	target: DOMRect | null,
	vp: Viewport,
	isMobile: boolean,
	cardH = MIN_CALLOUT_H,
): Placement | null {
	const cw = isMobile ? Math.min(CALLOUT_W, vp.w - 24) : CALLOUT_W;
	const h = vp.bottom - vp.top;

	if (!target) {
		return {
			side: "center",
			x: Math.max(12, (vp.w - cw) / 2),
			y: Math.max(vp.top, vp.top + (h - cardH) / 2),
		};
	}

	const spaceRight = vp.w - target.right - GAP;
	const spaceBelow = vp.bottom - target.bottom - GAP;
	const spaceAbove = target.top - vp.top - GAP;
	const spaceLeft = target.left - GAP;
	const targetCX = target.left + target.width / 2;
	const clampY = (y: number) =>
		Math.min(Math.max(y, vp.top), vp.bottom - cardH);
	const clampX = (x: number) =>
		Math.min(Math.max(x, 12), Math.max(12, vp.w - cw - 12));

	if (spaceRight >= cw) {
		return {
			side: "right",
			x: target.right + GAP,
			y: clampY(target.top - 10),
		};
	}

	if (spaceBelow >= cardH) {
		return {
			side: "bottom",
			x: clampX(targetCX - cw / 2),
			y: clampY(target.bottom + GAP),
		};
	}

	if (spaceAbove >= cardH) {
		return {
			side: "top",
			x: clampX(targetCX - cw / 2),
			y: clampY(target.top - GAP - cardH),
		};
	}

	if (spaceLeft >= cw) {
		return {
			side: "left",
			x: target.left - GAP - cw,
			y: clampY(target.top - 10),
		};
	}

	return { side: "bottom-sheet", x: 0, y: 0 };
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

function waitForEl(navId: string): Promise<Element | null> {
	return new Promise((resolve) => {
		let retries = 0;
		function poll() {
			const el = document.querySelector(`[data-nav-id="${navId}"]`);
			if (el || retries > 10) return resolve(el);
			retries++;
			requestAnimationFrame(poll);
		}
		poll();
	});
}

function waitForScrollEnd(): Promise<void> {
	return new Promise((resolve) => {
		let done = false;
		const finish = () => {
			if (!done) {
				done = true;
				resolve();
			}
		};
		if (typeof window.onscrollend !== "undefined") {
			window.addEventListener("scrollend", finish, { once: true });
		} else {
			let lastY = window.scrollY;
			let stable = 0;
			const iv = setInterval(() => {
				if (window.scrollY === lastY) {
					if (++stable >= 3) {
						clearInterval(iv);
						finish();
					}
				} else {
					stable = 0;
					lastY = window.scrollY;
				}
			}, 80);
		}
		setTimeout(finish, 800);
	});
}

async function ensureVisible(el: Element): Promise<void> {
	const vp = getViewport();
	const r = el.getBoundingClientRect();
	if (r.top >= vp.top && r.bottom <= vp.bottom) return;
	const y0 = window.scrollY;
	el.scrollIntoView({ behavior: "smooth", block: "center" });
	// ponytail: fixed nav targets never scroll the window, so bail out once
	// it's clear no scroll started instead of waiting on scrollend.
	await new Promise<void>((resolve) => {
		const check = () => {
			if (window.scrollY !== y0) {
				waitForScrollEnd().then(resolve);
			} else {
				setTimeout(() => {
					window.scrollY !== y0 ? waitForScrollEnd().then(resolve) : resolve();
				}, 60);
			}
		};
		requestAnimationFrame(check);
	});
}

const PLATFORM_ICON: Record<Platform, typeof AndroidIcon> = {
	android: AndroidIcon,
	ios: AppleIcon,
	desktop: Monitor,
};

export function TutorialOverlay({ onFinish }: { onFinish: () => void }) {
	const [step, setStep] = useState(0);
	const [target, setTarget] = useState<DOMRect | null>(null);
	const [anim, setAnim] = useState<"in" | "out">("in");
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" && window.innerWidth < 768,
	);
	const [viewport, setViewport] = useState<Viewport>(() =>
		typeof window !== "undefined" ? getViewport() : { top: 0, bottom: 0, w: 0 },
	);
	const [platform] = useState<Platform>(() =>
		typeof navigator !== "undefined" ? detectPlatform() : "desktop",
	);
	const [standalone] = useState(
		() => typeof window !== "undefined" && isStandalone(),
	);
	const [cardH, setCardH] = useState(MIN_CALLOUT_H);
	const cardRef = useRef<HTMLDivElement | null>(null);

	const stepRef = useRef(step);
	stepRef.current = step;

	const steps = useMemo<Step[]>(() => {
		if (standalone) return [...BASE_STEPS, COMPLETION_STEP];
		return [
			...BASE_STEPS,
			{
				title: "Install sebagai Aplikasi",
				text: INSTALL_TEXT[platform].intro,
				navId: null,
				variant: "center",
				platform,
			},
			{
				title: "Cara Install",
				text: "Ikuti langkah-langkah di bawah sesuai perangkat Anda.",
				navId: null,
				variant: "center",
				platform,
				installSteps: INSTALL_TEXT[platform].steps,
			},
			COMPLETION_STEP,
		];
	}, [platform, standalone]);

	const stepsRef = useRef(steps);
	stepsRef.current = steps;

	const current = steps[step];
	const placement = calcPlacement(
		current?.navId !== null ? target : null,
		viewport,
		isMobile,
		cardH,
	);
	const isCompletion = current?.variant === "completion";
	const showSpotlight = target !== null && current?.navId != null;
	const showBackdrop = !isCompletion;
	const arrowDir = arrowStyle(placement?.side ?? "center");

	useEffect(() => {
		function refresh() {
			const mobile = window.innerWidth < 768;
			setIsMobile(mobile);
			setViewport(getViewport());
			const s = stepsRef.current[stepRef.current];
			const id = s?.navId
				? mobile
					? (s.mobileNavId ?? s.navId)
					: s.navId
				: null;
			setTarget(getTargetRect(id));
		}
		refresh();
		window.addEventListener("resize", refresh);
		window.visualViewport?.addEventListener("resize", refresh);
		window.visualViewport?.addEventListener("scroll", refresh);
		return () => {
			window.removeEventListener("resize", refresh);
			window.visualViewport?.removeEventListener("resize", refresh);
			window.visualViewport?.removeEventListener("scroll", refresh);
		};
	}, []);

	useEffect(() => {
		setAnim("out");
		const t1 = setTimeout(async () => {
			const s = steps[step];
			const id = s?.navId ?? null;
			if (!id) {
				setTarget(null);
			} else {
				const resolveId = window.innerWidth < 768 ? (s.mobileNavId ?? id) : id;
				const el = await waitForEl(resolveId);
				if (el) {
					await ensureVisible(el);
					setTarget(el.getBoundingClientRect());
				} else {
					setTarget(null);
				}
			}
			setCardH(cardRef.current?.offsetHeight ?? MIN_CALLOUT_H);
			setViewport(getViewport());
			setAnim("in");
		}, 220);
		return () => clearTimeout(t1);
	}, [step, steps]);

	useEffect(() => {
		if (steps[step]?.variant === "completion") {
			localStorage.setItem("sijil_tutorial_done", "1");
		}
	}, [step, steps]);

	function next() {
		if (step < steps.length - 1) {
			setStep(step + 1);
		} else {
			finish();
		}
	}

	function finish() {
		localStorage.setItem("sijil_tutorial_done", "1");
		onFinish();
	}

	function restart() {
		localStorage.removeItem("sijil_tutorial_done");
		setStep(0);
	}

	const isSheet = placement?.side === "bottom-sheet";

	return (
		<div className="fixed inset-0 z-[9999]">
			{/* Backdrop / tap-to-advance */}
			{showBackdrop && (
				<button
					type="button"
					className={`absolute inset-0 z-[1] ${
						showSpotlight ? "" : "bg-black/45"
					}`}
					aria-label="Lanjutkan tutorial"
					onClick={next}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") next();
					}}
				/>
			)}

			{/* Spotlight with box-shadow cutout */}
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

			{/* Glow ring */}
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
			{placement && current && (
				<div
					ref={cardRef}
					className={`absolute z-[4] max-w-[300px] w-[calc(100vw-24px)] rounded-2xl border bg-card p-5 shadow-xl transition-all duration-300 ease-out ${
						anim === "in"
							? "opacity-100 translate-y-0"
							: "opacity-0 translate-y-2"
					}`}
					style={{
						left: isSheet ? 12 : placement.x,
						top: isSheet ? "auto" : placement.y,
						bottom: isSheet ? 24 : "auto",
					}}
				>
					{/* Pointer arrow */}
					{arrowDir && (
						<div
							className="absolute"
							style={{
								width: 0,
								height: 0,
								...arrowDir,
							}}
						/>
					)}

					{!isCompletion && (
						<button
							type="button"
							onClick={finish}
							className="absolute right-3 top-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
						>
							<HugeiconsIcon icon={Cancel} className="w-4 h-4" />
						</button>
					)}

					{isCompletion ? (
						<div className="flex flex-col items-center text-center">
							<div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-3xl">
								🎉
							</div>
							<h3 className="mb-1 text-base font-semibold">{current.title}</h3>
							<p className="mb-5 text-sm leading-relaxed text-muted-foreground">
								{current.text}
							</p>
							<button
								type="button"
								onClick={finish}
								className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
							>
								Mulai Menggunakan Aplikasi
							</button>
							<button
								type="button"
								onClick={restart}
								className="mt-1 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors min-h-[44px] px-2"
							>
								Mulai Ulang Tutorial
							</button>
						</div>
					) : (
						<>
							{/* Step counter */}
							<p className="mb-1 text-xs font-medium text-primary">
								Langkah {step + 1} dari {steps.length}
							</p>

							{current.platform && (
								<div className="mb-3 flex justify-center">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
										<HugeiconsIcon
											icon={PLATFORM_ICON[current.platform]}
											className="size-6"
										/>
									</div>
								</div>
							)}

							<h3 className="mb-1 text-base font-semibold">{current.title}</h3>
							<p className="mb-4 text-sm leading-relaxed text-muted-foreground">
								{current.text}
							</p>

							{current.installSteps && (
								<ol className="mb-4 space-y-2">
									{current.installSteps.map((s, i) => (
										<li
											key={s}
											className="flex gap-2 text-sm text-muted-foreground"
										>
											<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
												{i + 1}
											</span>
											<span className="leading-relaxed">{s}</span>
										</li>
									))}
								</ol>
							)}

							{/* Buttons */}
							<div className="flex items-center justify-between">
								<button
									type="button"
									onClick={finish}
									className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors min-h-[44px] px-2"
								>
									Lewati tutorial
								</button>
								<button
									type="button"
									onClick={next}
									className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
								>
									{step < steps.length - 1 ? "Selanjutnya" : "Selesai"}
								</button>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
