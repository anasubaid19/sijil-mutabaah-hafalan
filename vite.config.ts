import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		port: 26726,
	},
	optimizeDeps: {
		exclude: ["@tanstack/start-server-core"],
	},
	environments: {
		ssr: {
			optimizeDeps: {
				exclude: ["@tanstack/start-server-core"],
			},
		},
		client: {
			optimizeDeps: {
				exclude: ["@tanstack/start-server-core"],
			},
		},
	},
	plugins: [
		tailwindcss(),
		tanstackStart({
			srcDirectory: "src",
		}),
		react(),
		nitro(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["logo-sijil-v3.svg"],
			manifest: {
				name: "Sijil Mutaba'ah",
				short_name: "Sijil",
				description:
					"Tahsin & Hifz Tracker — Catat dan pantau hafalan Al-Quran",
				start_url: "/",
				scope: "/",
				display: "standalone",
				orientation: "portrait-primary",
				background_color: "#ffffff",
				theme_color: "#4f46e5",
				categories: ["education", "productivity"],
				icons: [
					{
						src: "logo-sijil-v3.svg",
						sizes: "any",
						type: "image/svg+xml",
					},
					{
						src: "icon-192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "icon-512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/ep-misty-surf.*\/.*/i,
						handler: "NetworkFirst",
						options: {
							cacheName: "api-cache",
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24,
							},
						},
					},
				],
			},
		}),
	],
});
