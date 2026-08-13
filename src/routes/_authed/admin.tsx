import {
	BookOpen,
	CalendarCheck,
	Clock,
	Group01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/start-server-core";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth/auth";

interface Stats {
	totalUsers: number;
	totalMusyrif: number;
	totalSiswa: number;
	totalSetoran: number;
	users: {
		id: string;
		name: string;
		username: string;
		email: string;
		createdAt: string;
		role: string;
		halaqahName: string | null;
	}[];
}

type IconSvgObject = IconSvgElement;

const checkSession = createServerFn({ method: "GET" }).handler(async () => {
	const session = await auth.api.getSession({
		headers: getRequest().headers,
	});
	return session;
});

export const Route = createFileRoute("/_authed/admin")({
	beforeLoad: async () => {
		const session = await checkSession();
		if (!session || session.user?.username !== "anasubaid19")
			throw redirect({ to: "/dashboard" });
	},
	component: AdminPage,
});

function AdminPage() {
	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(true);

	const [configOpen, setConfigOpen] = useState(false);
	const [botToken, setBotToken] = useState("");
	const [chatId, setChatId] = useState("");
	const [configLoading, setConfigLoading] = useState(false);
	const [hasConfig, setHasConfig] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const [statsRes, configRes] = await Promise.all([
					fetch("/api/admin-stats"),
					fetch("/api/admin-config"),
				]);
				if (statsRes.ok) setStats(await statsRes.json());
				if (configRes.ok) {
					const cfg = await configRes.json();
					setBotToken(cfg.botToken || "");
					setChatId(cfg.chatId || "");
					if (!cfg.botToken || !cfg.chatId) {
						setHasConfig(false);
						setConfigOpen(true);
					}
				}
			} catch {}
			setLoading(false);
		}
		load();
	}, []);

	async function saveConfig(e: React.FormEvent) {
		e.preventDefault();
		if (!botToken.trim() || !chatId.trim()) {
			toast.error("Isi bot token dan chat ID");
			return;
		}
		setConfigLoading(true);
		try {
			await Promise.all([
				fetch("/api/admin-config", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ key: "TELEGRAM_BOT_TOKEN", value: botToken }),
				}),
				fetch("/api/admin-config", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ key: "TELEGRAM_CHAT_ID", value: chatId }),
				}),
			]);
			toast.success("Konfigurasi Telegram tersimpan!");
			setConfigOpen(false);
			setHasConfig(true);
		} catch {
			toast.error("Gagal menyimpan konfigurasi");
		} finally {
			setConfigLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-sm text-muted-foreground">Memuat...</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-base font-semibold">Dasbor Admin</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Ringkasan data aplikasi
					</p>
				</div>
				{!hasConfig && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => setConfigOpen(true)}
					>
						Konfigurasi Telegram
					</Button>
				)}
			</div>

			{stats && (
				<>
					<div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
						<StatCard
							icon={Group01Icon}
							label="Total Pengguna"
							value={stats.totalUsers}
							color="text-primary"
						/>
						<StatCard
							icon={BookOpen}
							label="Total Musyrif"
							value={stats.totalMusyrif}
							color="text-blue-600 dark:text-blue-400"
						/>
						<StatCard
							icon={CalendarCheck}
							label="Total Siswa"
							value={stats.totalSiswa}
							color="text-emerald-600 dark:text-emerald-400"
						/>
						<StatCard
							icon={Clock}
							label="Total Setoran"
							value={stats.totalSetoran}
							color="text-amber-600 dark:text-amber-400"
						/>
					</div>

					{stats.users.length > 0 && (
						<div className="rounded-2xl border bg-card p-5 shadow-xs">
							<h2 className="mb-4 text-base font-semibold">Daftar Pengguna</h2>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/50 text-[0.65rem] font-semibold uppercase text-muted-foreground">
											<th className="px-3 py-2 text-left">No</th>
											<th className="px-3 py-2 text-left">Nama</th>
											<th className="px-3 py-2 text-left">Username</th>
											<th className="px-3 py-2 text-left">Email</th>
											<th className="px-3 py-2 text-left">Peran</th>
											<th className="px-3 py-2 text-left">Halaqah</th>
											<th className="px-3 py-2 text-left">Daftar</th>
										</tr>
									</thead>
									<tbody>
										{stats.users.map((u, i) => (
											<tr
												key={u.id}
												className="border-b border-border transition-colors hover:bg-muted/30"
											>
												<td className="px-3 py-2.5 text-muted-foreground">
													{i + 1}
												</td>
												<td className="px-3 py-2.5 font-medium">{u.name}</td>
												<td className="px-3 py-2.5">@{u.username}</td>
												<td className="px-3 py-2.5 text-muted-foreground">
													{u.email}
												</td>
												<td className="px-3 py-2.5">
													<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
														{u.role}
													</span>
												</td>
												<td className="px-3 py-2.5 text-muted-foreground">
													{u.halaqahName ?? "—"}
												</td>
												<td className="px-3 py-2.5 text-muted-foreground text-xs">
													{new Date(`${u.createdAt}`).toLocaleDateString(
														"id-ID",
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</>
			)}

			{/* Telegram config dialog */}
			<Dialog open={configOpen} onOpenChange={setConfigOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Konfigurasi Telegram</DialogTitle>
					</DialogHeader>
					<form onSubmit={saveConfig} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="bot-token" className="text-sm font-medium">
								Bot Token
							</label>
							<Input
								id="bot-token"
								value={botToken}
								onChange={(e) => setBotToken(e.target.value)}
								placeholder="8887813533:AA..."
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="chat-id" className="text-sm font-medium">
								Chat ID
							</label>
							<Input
								id="chat-id"
								value={chatId}
								onChange={(e) => setChatId(e.target.value)}
								placeholder="-100123456789"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setConfigOpen(false)}
							>
								Batal
							</Button>
							<Button type="submit" disabled={configLoading}>
								{configLoading ? "Menyimpan..." : "Simpan"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function StatCard({
	icon,
	label,
	value,
	color,
}: {
	icon: IconSvgObject;
	label: string;
	value: number | string;
	color: string;
}) {
	return (
		<div className="flex min-h-24 items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-primary/20 hover:shadow-sm">
			<div
				className={`flex size-10 items-center justify-center rounded-xl bg-muted ${color}`}
			>
				<HugeiconsIcon icon={icon} strokeWidth={1.8} />
			</div>
			<div>
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className="text-2xl font-bold tracking-tight">{value}</p>
			</div>
		</div>
	);
}
