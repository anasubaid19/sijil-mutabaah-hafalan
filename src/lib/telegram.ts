import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";

async function resolveTelegramConfig(): Promise<{
	botToken: string;
	chatId: string;
}> {
	let botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
	let chatId = process.env.TELEGRAM_CHAT_ID ?? "";
	if (!botToken || !chatId) {
		const rows = await db.select().from(appConfig);
		for (const r of rows) {
			if (!botToken && r.key === "TELEGRAM_BOT_TOKEN") botToken = r.value ?? "";
			if (!chatId && r.key === "TELEGRAM_CHAT_ID") chatId = r.value ?? "";
		}
	}
	return { botToken, chatId };
}

export async function sendTelegram(text: string): Promise<boolean> {
	const { botToken, chatId } = await resolveTelegramConfig();
	if (!botToken || !chatId) return false;
	const res = await fetch(
		`https://api.telegram.org/bot${botToken}/sendMessage`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				text,
				parse_mode: "Markdown",
			}),
		},
	).catch(() => null);
	return res?.ok ?? false;
}
