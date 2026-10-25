import { Bug, LogOut, PanelLeftOpen } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ReportDialog } from "@/components/report-dialog";
import { ToggleTheme } from "@/components/toggle-theme";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/auth-client";

interface HeaderProps {
	title: string;
}

export function Header({ title }: HeaderProps) {
	const { toggleSidebar } = useSidebar();
	const navigate = useNavigate();
	const [reportOpen, setReportOpen] = useState(false);

	async function handleLogout() {
		await authClient.signOut();
		navigate({ to: "/login" });
	}

	return (
		<header className="material-bar sticky top-0 z-40 flex min-h-11 items-center justify-between gap-2 border-b border-border/60 px-3 pt-[env(safe-area-inset-top)] md:min-h-12 md:px-5">
			<div className="flex min-w-0 items-center gap-2 md:gap-2.5">
				{/* Desktop: sidebar toggle */}
				<Button
					variant="ghost"
					size="icon-sm"
					className="hidden md:inline-flex"
					onClick={toggleSidebar}
					aria-label="Sembunyikan atau tampilkan menu samping"
				>
					<HugeiconsIcon icon={PanelLeftOpen} strokeWidth={1.9} aria-hidden />
				</Button>
				{/* Brand — mobile only; desktop keeps the title in the sidebar */}
				<div className="flex min-w-0 items-center gap-2 md:hidden">
					<img
						src="/logo-sijil-v3.svg"
						alt=""
						className="size-7 shrink-0 rounded-[0.5rem]"
					/>
					<span className="truncate text-[1.0625rem] font-semibold tracking-[-0.02em]">
						{title}
					</span>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-0.5 md:gap-1">
				<ToggleTheme />
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => setReportOpen(true)}
					aria-label="Laporkan Masalah"
				>
					<HugeiconsIcon icon={Bug} strokeWidth={1.9} aria-hidden />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleLogout}
					aria-label="Keluar"
				>
					<HugeiconsIcon icon={LogOut} strokeWidth={1.9} aria-hidden />
				</Button>
			</div>
			<ReportDialog open={reportOpen} onOpenChange={setReportOpen} />
		</header>
	);
}
