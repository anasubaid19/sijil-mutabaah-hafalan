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
			<Sidebar>
				<SidebarHeader>
					<div className="flex items-center gap-2.5 px-2 py-1.5">
						<img
							src="/logo-sijil-v3.svg"
							alt="Sijil"
							className="size-8 rounded-xl"
						/>
						<div className="flex flex-col">
							<span className="text-sm font-semibold leading-tight">
								Sijil Mutaba'ah
							</span>
							<span className="text-xs leading-tight text-muted-foreground">
								Tahsin & Hifz Tracker
							</span>
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">
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
											className="relative data-active:bg-primary/10 data-active:text-primary data-active:before:absolute data-active:before:inset-y-1.5 data-active:before:start-0 data-active:before:w-0.5 data-active:before:rounded-full data-active:before:bg-primary"
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
						<SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">
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
											className="relative data-active:bg-primary/10 data-active:text-primary data-active:before:absolute data-active:before:inset-y-1.5 data-active:before:start-0 data-active:before:w-0.5 data-active:before:rounded-full data-active:before:bg-primary"
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
											className="relative data-active:bg-primary/10 data-active:text-primary data-active:before:absolute data-active:before:inset-y-1.5 data-active:before:start-0 data-active:before:w-0.5 data-active:before:rounded-full data-active:before:bg-primary"
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
