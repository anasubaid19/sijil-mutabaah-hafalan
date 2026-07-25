import {
	BookOpen,
	ChartBarIncreasingIcon,
	Document,
	Home,
	SlidersHorizontal,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
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

const NAV_ITEMS = [
	{ to: "/dashboard", label: "Beranda", icon: Home },
	{ to: "/ziyadah", label: "Ziyadah", icon: BookOpen },
	{ to: "/murajaah", label: "Murajaah", icon: ChartBarIncreasingIcon },
];
const NAV_SECONDARY = [
	{ to: "/laporan", label: "Laporan", icon: Document },
	{ to: "/pengaturan", label: "Pengaturan", icon: SlidersHorizontal },
];

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader>
				<div className="flex items-center gap-2.5 px-2 py-1.5">
					<img
						src="/logo-sijil.svg"
						alt="Sijil"
						className="size-8 rounded-xl"
					/>
					<div className="flex flex-col">
						<span className="text-sm font-semibold leading-tight">
							Sijil Mutaba'ah
						</span>
						<span className="text-[0.65rem] leading-tight text-muted-foreground">
							Tahsin & Hifz Tracker
						</span>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider">
						Navigasi
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton
										render={<Link to={item.to} />}
										tooltip={item.label}
										className="data-[active=true]:bg-foreground data-[active=true]:text-background"
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
					<SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider">
						Lainnya
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_SECONDARY.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton
										render={<Link to={item.to} />}
										tooltip={item.label}
										className="data-[active=true]:bg-foreground data-[active=true]:text-background"
									>
										<HugeiconsIcon icon={item.icon} strokeWidth={1.8} />
										<span>{item.label}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarSeparator />

			<SidebarFooter>
				<div className="flex items-center justify-between px-2 py-1.5">
					<span className="text-[0.65rem] font-medium text-muted-foreground">
						Tema
					</span>
					<ToggleTheme />
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
