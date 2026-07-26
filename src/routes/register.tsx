import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	const [nama, setNama] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const { error: authError } = await authClient.signUp.email({
			name: nama,
			email: `${username}@sijil.local`,
			password,
			username,
		});

		setLoading(false);

		if (authError) {
			setError(authError.message || "Gagal mendaftar");
			return;
		}

		navigate({ to: "/dashboard" });
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-8 shadow-xs">
				<div className="flex flex-col items-center gap-2">
					<img
						src="/logo-sijil-v3.svg"
						alt="Sijil"
						className="size-12 rounded-2xl"
					/>
					<h1 className="text-xl font-bold tracking-tight">Daftar Akun Baru</h1>
					<p className="text-center text-sm text-muted-foreground">
						Buat akun untuk mulai melacak hafalan
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="nama" className="text-sm font-medium">
							Nama Lengkap
						</label>
						<Input
							id="nama"
							type="text"
							placeholder="Ustadz Ahmad"
							value={nama}
							onChange={(e) => setNama(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="username" className="text-sm font-medium">
							Username
						</label>
						<Input
							id="username"
							type="text"
							placeholder="Pilih username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							minLength={3}
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium">
							Password
						</label>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
						/>
					</div>

					<Button type="submit" disabled={loading} className="w-full">
						{loading ? "Mendaftar..." : "Daftar"}
					</Button>
				</form>

				<p className="text-center text-sm text-muted-foreground">
					Sudah punya akun?{" "}
					<Link
						to="/login"
						className="font-medium text-primary hover:underline"
					>
						Masuk
					</Link>
				</p>
			</div>
		</div>
	);
}
