import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/start-server-core";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/auth";

const checkSession = createServerFn({ method: "GET" }).handler(async () => {
	const session = await auth.api.getSession({
		headers: getRequest().headers,
	});
	return session;
});

export const Route = createFileRoute("/_authed")({
	beforeLoad: async () => {
		const session = await checkSession();
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
