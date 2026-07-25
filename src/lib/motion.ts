import type { Transition, Variants } from "motion";

// Apple Design spring presets
// Based on WWDC "Designing Fluid Interfaces" — damping + response mapping
// damping 1.0 = critically damped (no overshoot)
// damping ~0.8 = under-damped (slight bounce, for momentum interactions)

export const SPRING = {
	/** Default UI: no overshoot, graceful settle. Use for buttons, cards, most transitions. */
	default: {
		type: "spring",
		bounce: 0,
		duration: 0.4,
	} satisfies Transition,

	/** Momentum/flick: slight bounce. Only for gesture-driven interactions. */
	momentum: {
		type: "spring",
		bounce: 0.2,
		duration: 0.4,
	} satisfies Transition,

	/** Sheet/drawer: gentle overshoot. For bottom sheets, side panels. */
	sheet: {
		type: "spring",
		bounce: 0.15,
		duration: 0.35,
	} satisfies Transition,

	/** Page transitions: slow, no bounce. For route changes. */
	gentle: {
		type: "spring",
		bounce: 0,
		duration: 0.6,
	} satisfies Transition,

	/** Micro-interaction: fast, no bounce. For toggles, small state changes. */
	micro: {
		type: "spring",
		bounce: 0,
		duration: 0.2,
	} satisfies Transition,
} as const;

/** Reduced motion fallback — instant, no animation */
export const REDUCED_MOTION: Transition = {
	duration: 0,
};

/** Common variants for page enter/exit with AnimatePresence */
export const pageVariants = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -8 },
} satisfies Variants;

/** Card enter — stagger children */
export const cardContainerVariants = {
	initial: {},
	animate: {
		transition: {
			staggerChildren: 0.05,
		},
	},
} satisfies Variants;

export const cardItemVariants = {
	initial: { opacity: 0, y: 12 },
	animate: {
		opacity: 1,
		y: 0,
		transition: SPRING.default,
	},
} satisfies Variants;

/** Sheet/drawer slide variants */
export const sheetVariants = {
	initial: { y: "100%" },
	animate: { y: "0%" },
	exit: { y: "100%" },
} satisfies Variants;

/** Sidebar collapse variants */
export const sidebarVariants = {
	expanded: { width: "16rem" },
	collapsed: { width: "3.75rem" },
} satisfies Variants;
