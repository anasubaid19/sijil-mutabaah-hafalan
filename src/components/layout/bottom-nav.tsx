import {
	BookBookmark01Icon,
	BookOpen,
	CalendarCheck,
	ChartBarIncreasingIcon,
	Document,
	Group01Icon,
	Home,
	MoreHorizontalCircle01Icon,
	SlidersHorizontal,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth/auth-client";

const MAIN_TABS = [
	{ to: "/dashboard", label: "Beranda", icon: Home, navId: "nav-dashboard" },
	{ to: "/ziyadah", label: "Ziyadah", icon: BookOpen, navId: "nav-ziyadah" },
	{
		to: "/murajaah",
		label: "Murajaah",
		icon: ChartBarIncreasingIcon,
		navId: "nav-murajaah",
	},
	{
		to: "/presensi",
		label: "Presensi",
		icon: CalendarCheck,
		navId: "nav-presensi",
	},
];

const SECONDARY_ITEMS = [
	{ to: "/laporan", label: "Laporan", icon: Document },
	{ to: "/kitab", label: "Kitab", icon: BookBookmark01Icon },
	{ to: "/manajemen-data", label: "Manajemen Data", icon: Group01Icon },
	{ to: "/pengaturan", label: "Pengaturan", icon: SlidersHorizontal },
];

export function BottomNav() {
	const [open, setOpen] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isActive = (to: string) =>
		pathname === to || pathname.startsWith(`${to}/`);
	const { data } = authClient.useSession();
	const isAdmin = data?.user?.username === "anasubaid19";
	const lainnyaActive = SECONDARY_ITEMS.some((item) => isActive(item.to));

	return (
		<>
			<nav
				className="material-bar fixed inset-x-0 bottom-0 z-50 border-t border-border/60 pb-[env(safe-area-inset-bottom)] md:hidden"
				data-bottom-nav
			>
				<div className="flex items-stretch justify-around px-1">
					{MAIN_TABS.map((item) => {
						const active = isActive(item.to);
						return (
							<Link
								key={item.to}
								to={item.to}
								data-nav-id={item.navId}
								aria-current={active ? "page" : undefined}
								className={`flex min-h-[49px] flex-1 flex-col items-center justify-center gap-0.5 pt-1 pb-1 transition-colors duration-[var(--duration-fast)] ${
									active ? "text-primary" : "text-muted-foreground"
								}`}
							>
								<HugeiconsIcon
									icon={item.icon}
									className="size-[25px]"
									strokeWidth={active ? 2.1 : 1.7}
								/>
								<span className="text-[0.625rem] font-medium tracking-[0.01em]">
									{item.label}
								</span>
							</Link>
						);
					})}
					<button
						type="button"
						onClick={() => setOpen(true)}
						data-nav-id="nav-lainnya"
						className={`flex min-h-[49px] flex-1 flex-col items-center justify-center gap-0.5 pt-1 pb-1 transition-colors duration-[var(--duration-fast)] ${
							lainnyaActive ? "text-primary" : "text-muted-foreground"
						}`}
					>
						<HugeiconsIcon
							icon={MoreHorizontalCircle01Icon}
							className="size-[25px]"
							strokeWidth={lainnyaActive ? 2.1 : 1.7}
						/>
						<span className="text-[0.625rem] font-medium tracking-[0.01em]">
							Lainnya
						</span>
					</button>
				</div>
			</nav>

			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent side="bottom" showCloseButton={false}>
					<div className="mx-auto mt-2 mb-1 h-1 w-9 rounded-full bg-muted-foreground/30" />
					<SheetHeader className="pb-2">
						<SheetTitle className="text-[1.375rem] font-bold tracking-[-0.024em]">
							Lainnya
						</SheetTitle>
					</SheetHeader>
					<div className="ios-list mx-4 mb-6 mt-1">
						{[...SECONDARY_ITEMS, ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: UserGroupIcon }] : [])].map(
							(item) => {
								const active = isActive(item.to);
								return (
									<Link
										key={item.to}
										to={item.to}
										onClick={() => setOpen(false)}
										className={`ios-row min-h-12 ${
											active ? "text-primary" : "text-foreground"
										}`}
									>
										<HugeiconsIcon
											icon={item.icon}
											className="size-[22px]"
											strokeWidth={1.9}
										/>
										<span className="flex-1 text-[1.0625rem] font-medium">
											{item.label}
										</span>
									</Link>
								);
							},
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
