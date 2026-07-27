import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "../db";
import { appConfig, userProfile } from "../db/schema";

export const auth = betterAuth({
	trustedOrigins: (request) => {
		if (!request?.headers) return [];
		const origin = request.headers.get("origin");
		if (origin?.startsWith("http://localhost:")) return [origin];
		const extra = process.env.TRUSTED_ORIGINS?.split(",") || [];
		if (origin && extra.includes(origin)) return [origin];
		return [];
	},
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	databaseHooks: {
		user: {
			create: {
				after: async (createdUser) => {
					await db.insert(userProfile).values({
						id: createdUser.id,
						nama: createdUser.name,
						role: "musyrif",
					});

					// Telegram notification
					let botToken = process.env.TELEGRAM_BOT_TOKEN;
					let chatId = process.env.TELEGRAM_CHAT_ID;
					if (!botToken || !chatId) {
						const rows = await db.select().from(appConfig);
						for (const r of rows) {
							if (r.key === "TELEGRAM_BOT_TOKEN") botToken = r.value ?? "";
							if (r.key === "TELEGRAM_CHAT_ID") chatId = r.value ?? "";
						}
					}
					if (botToken && chatId) {
						const msg = `🆕 *User Baru Sijil!*\nNama: ${createdUser.name}\nUsername: @${createdUser.username}\nEmail: ${createdUser.email}\nWaktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`;
						await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								chat_id: chatId,
								text: msg,
								parse_mode: "Markdown",
							}),
						}).catch(() => {});
					}
				},
			},
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		username({
			minUsernameLength: 3,
			maxUsernameLength: 30,
		}),
	],
});
