import {
	BookBookmark01Icon,
	BookOpen,
	CalendarCheck,
	ChartBarIncreasingIcon,
	Document,
	Group01Icon,
	Home,
	SlidersHorizontal,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ToggleTheme } from "@/components/toggle-theme";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/auth-client";

const NAV_ITEMS = [
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
const NAV_SECONDARY = [
	{ to: "/laporan", label: "Laporan", icon: Document, navId: "nav-laporan" },
	{
		to: "/kitab",
		label: "Kitab",
		icon: BookBookmark01Icon,
		navId: "nav-kitab",
	},
	{
		to: "/manajemen-data",
		label: "Manajemen Data",
		icon: Group01Icon,
		navId: "nav-manajemen",
	},
	{
		to: "/pengaturan",
		label: "Pengaturan",
		icon: SlidersHorizontal,
		navId: "nav-pengaturan",
	},
];

export function AppSidebar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isActive = (to: string) =>
		pathname === to || pathname.startsWith(`${to}/`);
	const { data } = authClient.useSession();
	const isAdmin = data?.user?.username === "anasubaid19";
	return (
		<div className="hidden md:block">
			<Sidebar className="border-r border-sidebar-border">
				<SidebarHeader>
					<div className="flex items-center gap-2.5 px-2 py-2">
						<img
							src="/logo-sijil-v3.svg"
							alt=""
							className="size-8 rounded-[0.625rem]"
						/>
						<div className="flex min-w-0 flex-col">
							<span className="truncate text-[0.9375rem] font-semibold leading-tight tracking-[-0.015em]">
								Sijil Mutaba'ah
							</span>
							<span className="truncate text-[0.75rem] leading-tight text-muted-foreground">
								Tahsin & Hifz Tracker
							</span>
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel className="px-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
							Navigasi
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{NAV_ITEMS.map((item) => (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton
											isActive={isActive(item.to)}
											render={<Link to={item.to} data-nav-id={item.navId} />}
											tooltip={item.label}
											className="relative"
										>
											<HugeiconsIcon icon={item.icon} strokeWidth={1.8} />
											<span>{item.label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<SidebarGroup>
						<SidebarGroupLabel className="px-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
							Lainnya
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{NAV_SECONDARY.map((item) => (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton
											isActive={isActive(item.to)}
											render={<Link to={item.to} data-nav-id={item.navId} />}
											tooltip={item.label}
											className="relative"
										>
											<HugeiconsIcon icon={item.icon} strokeWidth={1.8} />
											<span>{item.label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
								{isAdmin && (
									<SidebarMenuItem>
										<SidebarMenuButton
											isActive={isActive("/admin")}
											render={<Link to="/admin" data-nav-id="nav-admin" />}
											tooltip="Admin"
											className="relative"
										>
											<HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.8} />
											<span>Admin</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarSeparator />

				<SidebarFooter>
					<div className="flex items-center justify-center px-2 py-1.5">
						<ToggleTheme />
					</div>
				</SidebarFooter>
			</Sidebar>
		</div>
	);
}
