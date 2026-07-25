import { LogOut, PanelLeftOpen } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";
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

	async function handleLogout() {
		await authClient.signOut();
		navigate({ to: "/login" });
	}

	return (
		<header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon-sm"
					className="md:hidden"
					onClick={toggleSidebar}
				>
					<HugeiconsIcon icon={PanelLeftOpen} strokeWidth={2} />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					className="hidden md:flex"
					onClick={toggleSidebar}
				>
					<HugeiconsIcon icon={PanelLeftOpen} strokeWidth={2} />
				</Button>
				<h1 className="text-base font-semibold">{title}</h1>
			</div>
			<div className="flex items-center gap-2">
				<ToggleTheme />
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleLogout}
					tooltip="Keluar"
				>
					<HugeiconsIcon icon={LogOut} strokeWidth={1.8} />
				</Button>
			</div>
		</header>
	);
}
