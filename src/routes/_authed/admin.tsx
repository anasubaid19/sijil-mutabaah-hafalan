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
import { PageHeader } from "@/components/layout/page-header";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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

	const [bannerEnabled, setBannerEnabled] = useState(false);
	const [bannerMessage, setBannerMessage] = useState("");
	const [bannerSaving, setBannerSaving] = useState(false);

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
					setBannerEnabled(Boolean(cfg.migrationBannerEnabled));
					setBannerMessage(cfg.migrationBannerMessage || "");
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

	async function saveBanner() {
		setBannerSaving(true);
		try {
			await Promise.all([
				fetch("/api/admin-config", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						key: "MIGRATION_BANNER_ENABLED",
						value: bannerEnabled ? "1" : "0",
					}),
				}),
				fetch("/api/admin-config", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						key: "MIGRATION_BANNER_MESSAGE",
						value: bannerMessage,
					}),
				}),
			]);
			toast.success("Banner migrasi tersimpan!");
		} catch {
			toast.error("Gagal menyimpan banner");
		} finally {
			setBannerSaving(false);
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
			<PageHeader
				title="Dasbor Admin"
				subtitle="Ringkasan data aplikasi"
				actions={
					!hasConfig && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setConfigOpen(true)}
						>
							Konfigurasi Telegram
						</Button>
					)
				}
			/>

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
							color="text-system-blue"
						/>
						<StatCard
							icon={CalendarCheck}
							label="Total Siswa"
							value={stats.totalSiswa}
							color="text-system-green"
						/>
						<StatCard
							icon={Clock}
							label="Total Setoran"
							value={stats.totalSetoran}
							color="text-system-orange"
						/>
					</div>

					{stats.users.length > 0 && (
						<div className="min-w-0 rounded-2xl bg-card p-5 shadow-[var(--shadow-surface)]">
							<h2 className="mb-4 text-base font-semibold">Daftar Pengguna</h2>
							<div className="w-full min-w-0 max-w-full overflow-x-auto">
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

			{/* Migration banner config */}
			<div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-surface)]">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-semibold">Banner Migrasi Server</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Tampilkan pemberitahuan kepada semua pengguna setelah login.
						</p>
					</div>
					<Switch
						checked={bannerEnabled}
						onCheckedChange={setBannerEnabled}
						aria-label="Aktifkan banner migrasi"
					/>
				</div>
				<div className="mt-4 space-y-2">
					<Label htmlFor="banner-message">Pesan banner</Label>
					<Textarea
						id="banner-message"
						value={bannerMessage}
						onChange={(e) => setBannerMessage(e.target.value)}
						placeholder="Aplikasi akan dipindahkan ke server baru..."
					/>
				</div>
				<div className="mt-3 flex justify-end">
					<Button
						size="sm"
						onClick={saveBanner}
						disabled={bannerSaving}
					>
						{bannerSaving ? "Menyimpan..." : "Simpan"}
					</Button>
				</div>
			</div>

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
		<div className="flex min-h-24 items-center gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-surface)] transition-[border-color,box-shadow] duration-150 hover:border-primary/20 hover:shadow-sm">
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
