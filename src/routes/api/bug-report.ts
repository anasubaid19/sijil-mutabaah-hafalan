import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/auth";
import { sendTelegram } from "@/lib/telegram";

const KATEGORI = ["Bug", "Saran", "Lainnya"] as const;

export const Route = createFileRoute("/api/bug-report")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				});
				if (!session)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				try {
					const body = (await request.json()) as {
						kategori?: string;
						pesan?: string;
					};
					const pesan = (body.pesan ?? "").trim();
					if (!pesan || pesan.length > 2000) {
						return Response.json(
							{ error: "Pesan harus diisi (maks 2000 karakter)" },
							{ status: 400 },
						);
					}
					const kategori = KATEGORI.includes(
						body.kategori as (typeof KATEGORI)[number],
					)
						? body.kategori
						: "Lainnya";

					const u = session.user;
					const text = [
						"🐞 *Laporan Baru Sijil*",
						`👤 ${u.name} (@${u.username})`,
						`📬 ${u.email}`,
						`🏷️ Kategori: ${kategori}`,
						`📝 ${pesan}`,
						`⏰ ${new Date().toLocaleString("id-ID", {
							timeZone: "Asia/Jakarta",
						})}`,
					].join("\n");

					const sent = await sendTelegram(text);
					if (!sent) {
						return Response.json(
							{ error: "Telegram belum dikonfigurasi" },
							{ status: 500 },
						);
					}
					return Response.json({ ok: true });
				} catch (e) {
					console.error("POST /api/bug-report error:", e);
					return Response.json(
						{ error: "Internal server error" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
