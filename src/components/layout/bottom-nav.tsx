import {
	BookOpen,
	ChartBarIncreasingIcon,
	Document,
	Home,
	SlidersHorizontal,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

const NAV_ITEMS = [
	{ to: "/dashboard", label: "Beranda", icon: Home },
	{ to: "/ziyadah", label: "Ziyadah", icon: BookOpen },
	{ to: "/murajaah", label: "Murajaah", icon: ChartBarIncreasingIcon },
	{ to: "/laporan", label: "Laporan", icon: Document },
	{ to: "/pengaturan", label: "Pengaturan", icon: SlidersHorizontal },
];

export function BottomNav() {
	return (
		<nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
			<div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
				{NAV_ITEMS.map((item) => (
					<Link
						key={item.to}
						to={item.to}
						className="flex flex-1 flex-col items-center gap-0.5 py-2 text-muted-foreground transition-colors"
						activeProps={{
							className: "text-primary",
						}}
					>
						<HugeiconsIcon
							icon={item.icon}
							className="size-5"
							strokeWidth={1.8}
						/>
						<span className="text-[0.6rem] font-semibold uppercase tracking-wider">
							{item.label}
						</span>
					</Link>
				))}
			</div>
		</nav>
	);
}
