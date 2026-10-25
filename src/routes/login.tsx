import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [tab, setTab] = useState<"ustadz" | "orangtua">("ustadz");

	// Ustadz login
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	// Orang tua login
	const [studentId, setStudentId] = useState("");

	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleUstadzLogin(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const { error: authError } = await authClient.signIn.username({
			username,
			password,
		});

		setLoading(false);

		if (authError) {
			setError(authError.message || "Username atau password salah");
			return;
		}

		navigate({ to: "/dashboard" });
	}

	async function handleOrangTuaLogin(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/parent-auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ studentId }),
			});

			const data = await res.json();
			setLoading(false);

			if (!res.ok) {
				setError(data.error || "ID Siswa tidak ditemukan");
				return;
			}

			navigate({ to: "/parent" });
		} catch {
			setLoading(false);
			setError("Gagal menghubungi server");
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-6 rounded-[1.5rem] bg-card p-7 shadow-[var(--shadow-raised)] sm:p-8">
				<div className="flex flex-col items-center gap-2.5">
					<img
						src="/logo-sijil-v3.svg"
						alt="Sijil"
						className="size-14 rounded-[1rem] shadow-[var(--shadow-surface)]"
					/>
					<h1 className="text-title">Sijil Mutaba'ah</h1>
					<p className="text-center text-[0.9375rem] text-muted-foreground">
						Masuk untuk melacak hafalan
					</p>
				</div>

				{/* Tab Switcher */}
				<div
					className="flex rounded-[0.625rem] bg-secondary/80 p-[3px]"
					role="group"
					aria-label="Jenis akun"
				>
					<button
						type="button"
						aria-pressed={tab === "ustadz"}
						onClick={() => {
							setTab("ustadz");
							setError("");
						}}
						className={`flex-1 rounded-[0.5rem] py-2 text-[0.8125rem] font-semibold transition-colors duration-[var(--duration-fast)] ${
							tab === "ustadz"
								? "bg-card text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						Ustadz / Musyrif
					</button>
					<button
						type="button"
						aria-pressed={tab === "orangtua"}
						onClick={() => {
							setTab("orangtua");
							setError("");
						}}
						className={`flex-1 rounded-[0.5rem] py-2 text-[0.8125rem] font-semibold transition-colors duration-[var(--duration-fast)] ${
							tab === "orangtua"
								? "bg-card text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						Orang Tua
					</button>
				</div>

				{/* Ustadz Login */}
				{tab === "ustadz" && (
					<form onSubmit={handleUstadzLogin} className="space-y-4">
						{error && (
							<div
								id="login-error"
								role="alert"
								className="rounded-xl bg-destructive/10 px-4 py-3 text-[0.9375rem] text-destructive"
							>
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="username" className="text-[0.9375rem] font-medium">
								Username
							</label>
							<Input
								id="username"
								type="text"
								placeholder="Masukkan username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								aria-invalid={Boolean(error)}
								aria-describedby={error ? "login-error" : undefined}
								required
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="password" className="text-[0.9375rem] font-medium">
								Password
							</label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								aria-invalid={Boolean(error)}
								aria-describedby={error ? "login-error" : undefined}
								required
							/>
						</div>

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? "Masuk..." : "Masuk"}
						</Button>
					</form>
				)}

				{/* Orang Tua Login */}
				{tab === "orangtua" && (
					<form onSubmit={handleOrangTuaLogin} className="space-y-4">
						{error && (
							<div
								id="login-error"
								role="alert"
								className="rounded-xl bg-destructive/10 px-4 py-3 text-[0.9375rem] text-destructive"
							>
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="studentId" className="text-[0.9375rem] font-medium">
								ID Siswa
							</label>
							<Input
								id="studentId"
								type="text"
								placeholder="Masukkan ID siswa dari ustadz"
								value={studentId}
								onChange={(e) => setStudentId(e.target.value)}
								aria-invalid={Boolean(error)}
								aria-describedby={error ? "login-error" : undefined}
								required
							/>
						</div>

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? "Masuk..." : "Masuk"}
						</Button>
					</form>
				)}

				{tab === "ustadz" && (
					<p className="text-center text-[0.9375rem] text-muted-foreground">
						Belum punya akun?{" "}
						<Link
							to="/register"
							className="font-medium text-primary hover:underline"
						>
							Daftar
						</Link>
					</p>
				)}
			</div>
		</div>
	);
}
