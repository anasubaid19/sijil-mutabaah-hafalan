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
					<title>Sijil Mutaba'ah — Tahsin & Hifz Tracker</title>
					<meta
						name="description"
						content="Tahsin & Hifz Tracker — Catat dan pantau hafalan Al-Quran"
					/>
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

					{/* Open Graph / WhatsApp, Facebook, Telegram link preview */}
					<meta property="og:type" content="website" />
					<meta property="og:site_name" content="Sijil Mutaba'ah" />
					<meta
						property="og:title"
						content="Sijil Mutaba'ah — Tahsin & Hifz Tracker"
					/>
					<meta
						property="og:description"
						content="Catat dan pantau hafalan Al-Quran"
					/>
					<meta property="og:url" content="https://sijil.anasubaid.my.id/" />
					<meta
						property="og:image"
						content="https://sijil.anasubaid.my.id/og-banner.png"
					/>
					<meta property="og:image:width" content="1200" />
					<meta property="og:image:height" content="630" />

					{/* Twitter Card */}
					<meta name="twitter:card" content="summary_large_image" />
					<meta
						name="twitter:title"
						content="Sijil Mutaba'ah — Tahsin & Hifz Tracker"
					/>
					<meta
						name="twitter:description"
						content="Catat dan pantau hafalan Al-Quran"
					/>
					<meta
						name="twitter:image"
						content="https://sijil.anasubaid.my.id/og-banner.png"
					/>

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
