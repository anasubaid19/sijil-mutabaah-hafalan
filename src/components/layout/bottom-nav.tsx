import {
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
				className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] md:hidden"
				data-bottom-nav
			>
				<div className="mx-3 mb-2 flex items-center justify-around rounded-2xl border bg-background/95 shadow-lg backdrop-blur-sm">
					{MAIN_TABS.map((item) => {
						const active = isActive(item.to);
						return (
							<Link
								key={item.to}
								to={item.to}
								data-nav-id={item.navId}
								className={`flex flex-1 flex-col items-center gap-0.5 py-2 min-h-[48px] transition-colors duration-200 ${
									active ? "text-primary" : "text-muted-foreground"
								}`}
							>
								<div
									className={`flex items-center justify-center rounded-full transition-colors duration-200 ${
										active ? "bg-primary/10 p-1.5" : "p-1.5"
									}`}
								>
									<HugeiconsIcon
										icon={item.icon}
										className={`transition-[width,height] duration-200 ${
											active ? "size-[18px]" : "size-5"
										}`}
										strokeWidth={active ? 2 : 1.8}
									/>
								</div>
								<span
									className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
										active ? "text-primary" : ""
									}`}
								>
									{item.label}
								</span>
							</Link>
						);
					})}
					<button
						type="button"
						onClick={() => setOpen(true)}
						data-nav-id="nav-lainnya"
						className={`flex flex-1 flex-col items-center gap-0.5 py-2 min-h-[48px] transition-colors duration-200 ${
							lainnyaActive ? "text-primary" : "text-muted-foreground"
						}`}
					>
						<div
							className={`flex items-center justify-center rounded-full transition-colors duration-200 p-1.5 ${
								lainnyaActive ? "bg-primary/10" : ""
							}`}
						>
							<HugeiconsIcon
								icon={MoreHorizontalCircle01Icon}
								className="size-5"
								strokeWidth={1.8}
							/>
						</div>
						<span className="text-xs font-semibold uppercase tracking-wider transition-colors duration-200">
							Lainnya
						</span>
					</button>
				</div>
			</nav>

			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent
					side="bottom"
					showCloseButton={false}
					className="rounded-t-2xl"
				>
					<div className="mx-auto mt-2 mb-4 h-1.5 w-12 rounded-full bg-muted" />
					<SheetHeader>
						<SheetTitle>Lainnya</SheetTitle>
					</SheetHeader>
					<div className="space-y-1 pb-6">
						{SECONDARY_ITEMS.map((item) => {
							const active = isActive(item.to);
							return (
								<Link
									key={item.to}
									to={item.to}
									onClick={() => setOpen(false)}
									className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
										active
											? "bg-primary/10 text-primary font-medium"
											: "hover:bg-muted"
									}`}
								>
									<HugeiconsIcon
										icon={item.icon}
										className="size-5"
										strokeWidth={1.8}
									/>
									<span className="text-sm font-medium">{item.label}</span>
								</Link>
							);
						})}
						{isAdmin && (
							<Link
								to="/admin"
								onClick={() => setOpen(false)}
								className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
									isActive("/admin")
										? "bg-primary/10 text-primary font-medium"
										: "hover:bg-muted"
								}`}
							>
								<HugeiconsIcon
									icon={UserGroupIcon}
									className="size-5"
									strokeWidth={1.8}
								/>
								<span className="text-sm font-medium">Admin</span>
							</Link>
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
