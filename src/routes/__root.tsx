import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "@/lib/styles.css";

export const Route = createRootRoute({
	component: () => (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<html lang="id" suppressHydrationWarning>
				<head>
					<link rel="icon" href="/logo-sijil-v3.svg" type="image/svg+xml" />
					<meta name="theme-color" content="#4f46e5" />
					<meta name="apple-mobile-web-app-capable" content="yes" />
					<meta
						name="apple-mobile-web-app-status-bar-style"
						content="default"
					/>
					<meta name="apple-mobile-web-app-title" content="Sijil" />
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1, maximum-scale=1"
					/>
					<link rel="apple-touch-icon" href="/icon-192.png" />
					<HeadContent />
				</head>
				<body>
					<Outlet />
					<Toaster position="top-center" />
					<Scripts />
				</body>
			</html>
		</ThemeProvider>
	),
});
