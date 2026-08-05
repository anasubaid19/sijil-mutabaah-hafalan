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
		<header className="sticky top-0 z-40 flex h-12 md:h-14 items-center justify-between bg-background px-3 md:px-6 after:absolute after:bottom-0 after:-left-(--sidebar-width) after:right-0 after:h-px after:bg-border">
			<div className="flex items-center gap-2 md:gap-3">
				{/* Desktop: sidebar toggle */}
				<Button
					variant="ghost"
					size="icon-sm"
					className="hidden md:flex"
					onClick={toggleSidebar}
					aria-label="Sembunyikan atau tampilkan menu samping"
				>
					<HugeiconsIcon icon={PanelLeftOpen} strokeWidth={2} aria-hidden />
				</Button>
				{/* Logo — visible only on mobile (sidebar hidden) */}
				<img
					src="/logo-sijil-v3.svg"
					alt="Sijil"
					className="size-7 rounded-lg md:hidden"
				/>
				<h1 className="text-base font-semibold">{title}</h1>
			</div>
			<div className="flex items-center gap-1 md:gap-2">
				<ToggleTheme />
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => setReportOpen(true)}
					aria-label="Laporkan Masalah"
				>
					<HugeiconsIcon icon={Bug} strokeWidth={1.8} aria-hidden />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleLogout}
					aria-label="Keluar"
				>
					<HugeiconsIcon icon={LogOut} strokeWidth={1.8} aria-hidden />
				</Button>
			</div>
			<ReportDialog open={reportOpen} onOpenChange={setReportOpen} />
		</header>
	);
}
