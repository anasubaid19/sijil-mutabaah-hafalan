import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getRequest } from "@tanstack/start-server-core";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/auth";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async () => {
		const session = await auth.api.getSession({
			headers: getRequest().headers,
		});
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<Header title="Sijil Mutaba'ah" />
				<main className="flex-1 p-4 md:p-6">
					<Outlet />
				</main>
			</SidebarInset>
			<BottomNav />
		</SidebarProvider>
	);
}
