import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/start-server-core";
import { useCallback, useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/sidebar";
import { TutorialOverlay } from "@/components/tutorial-overlay";
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
	const navigate = useNavigate();
	const [showTutorial, setShowTutorial] = useState(false);

	useEffect(() => {
		const done = localStorage.getItem("sijil_tutorial_done");
		if (!done) {
			setShowTutorial(true);
		}
	}, []);

	useEffect(() => {
		function restart() {
			setShowTutorial(true);
		}
		window.addEventListener("sijil-restart-tutorial", restart);
		return () => window.removeEventListener("sijil-restart-tutorial", restart);
	}, []);

	const handleFinish = useCallback(() => {
		setShowTutorial(false);
		navigate({ to: "/dashboard" });
	}, [navigate]);

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
			{showTutorial && (
				<div id="sijil-tutorial-root">
					<TutorialOverlay onFinish={handleFinish} />
				</div>
			)}
		</SidebarProvider>
	);
}
