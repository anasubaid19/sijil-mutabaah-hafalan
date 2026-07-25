import crypto from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siswa } from "@/lib/db/schema";

const SECRET =
	process.env.BETTER_AUTH_SECRET || "sijil-parent-session-fallback";

function sign(data: string): string {
	const sig = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
	return `${Buffer.from(data).toString("base64")}.${sig}`;
}

function verify(signed: string): string | null {
	const [dataB64, sig] = signed.split(".");
	if (!dataB64 || !sig) return null;
	const expected = crypto
		.createHmac("sha256", SECRET)
		.update(Buffer.from(dataB64, "base64").toString())
		.digest("hex");
	if (sig !== expected) return null;
	return Buffer.from(dataB64, "base64").toString();
}

function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16).toString("hex");
	const hash = crypto.scryptSync(password, salt, 64).toString("hex");
	return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
	const [salt, expectedHash] = stored.split(":");
	const derived = crypto.scryptSync(password, salt, 64).toString("hex");
	return derived === expectedHash;
}

export const Route = createFileRoute("/api/parent-auth")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const body = await request.json();
				const { studentId, password } = body;

				if (!studentId || !password) {
					return Response.json(
						{ error: "ID Siswa dan password harus diisi" },
						{ status: 400 },
					);
				}

				const [row] = await db
					.select()
					.from(siswa)
					.where(eq(siswa.studentId, studentId))
					.limit(1);

				if (!row?.parentPassword) {
					return Response.json(
						{ error: "ID Siswa atau password salah" },
						{ status: 401 },
					);
				}

				if (!verifyPassword(password, row.parentPassword)) {
					return Response.json(
						{ error: "ID Siswa atau password salah" },
						{ status: 401 },
					);
				}

				const token = sign(
					JSON.stringify({
						siswaId: row.id,
						nama: row.nama,
						studentId: row.studentId,
						exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
					}),
				);

				const res = Response.json({
					siswa: { id: row.id, nama: row.nama, studentId: row.studentId },
				});
				res.headers.set(
					"Set-Cookie",
					`parent_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
				);
				return res;
			},

			GET: async ({ request }) => {
				const cookie = request.headers.get("cookie") || "";
				const match = cookie.match(/parent_session=([^;]+)/);
				if (!match)
					return Response.json({ error: "Not authenticated" }, { status: 401 });

				const payload = verify(match[1]);
				if (!payload)
					return Response.json({ error: "Invalid session" }, { status: 401 });

				const data = JSON.parse(payload);
				if (Date.now() > data.exp)
					return Response.json({ error: "Session expired" }, { status: 401 });

				return Response.json({
					siswa: {
						id: data.siswaId,
						nama: data.nama,
						studentId: data.studentId,
					},
				});
			},

			DELETE: async () => {
				const res = Response.json({ ok: true });
				res.headers.set(
					"Set-Cookie",
					"parent_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
				);
				return res;
			},
		},
	},
});

export { hashPassword, verifyPassword };
