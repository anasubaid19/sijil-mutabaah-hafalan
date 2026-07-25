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
	const [parentPassword, setParentPassword] = useState("");

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
				body: JSON.stringify({ studentId, password: parentPassword }),
			});

			const data = await res.json();
			setLoading(false);

			if (!res.ok) {
				setError(data.error || "ID Siswa atau password salah");
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
			<div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-xs">
				<div className="flex flex-col items-center gap-2">
					<img
						src="/logo-sijil.svg"
						alt="Sijil"
						className="size-12 rounded-2xl"
					/>
					<h1 className="text-xl font-bold tracking-tight">Sijil Mutaba'ah</h1>
					<p className="text-center text-sm text-muted-foreground">
						Masuk untuk melacak hafalan
					</p>
				</div>

				{/* Tab Switcher */}
				<div className="flex rounded-xl bg-muted p-1">
					<button
						type="button"
						onClick={() => {
							setTab("ustadz");
							setError("");
						}}
						className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
							tab === "ustadz"
								? "bg-background text-foreground shadow-xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						Ustadz / Musyrif
					</button>
					<button
						type="button"
						onClick={() => {
							setTab("orangtua");
							setError("");
						}}
						className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
							tab === "orangtua"
								? "bg-background text-foreground shadow-xs"
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
							<div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="username" className="text-sm font-medium">
								Username
							</label>
							<Input
								id="username"
								type="text"
								placeholder="Masukkan username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
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
							<div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="studentId" className="text-sm font-medium">
								ID Siswa
							</label>
							<Input
								id="studentId"
								type="text"
								placeholder="Masukkan ID siswa dari ustadz"
								value={studentId}
								onChange={(e) => setStudentId(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="parentPassword" className="text-sm font-medium">
								Password
							</label>
							<Input
								id="parentPassword"
								type="password"
								placeholder="••••••••"
								value={parentPassword}
								onChange={(e) => setParentPassword(e.target.value)}
								required
							/>
						</div>

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? "Masuk..." : "Masuk"}
						</Button>
					</form>
				)}

				{tab === "ustadz" && (
					<p className="text-center text-sm text-muted-foreground">
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
