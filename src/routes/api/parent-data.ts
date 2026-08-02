import crypto from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { presensi, setoran, siswa, userProfile } from "@/lib/db/schema";

const SECRET =
	process.env.BETTER_AUTH_SECRET || "sijil-parent-session-fallback";

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

function getParentSession(request: Request): { siswaId: string } | null {
	const cookie = request.headers.get("cookie") || "";
	const match = cookie.match(/parent_session=([^;]+)/);
	if (!match) return null;
	const payload = verify(match[1]);
	if (!payload) return null;
	const data = JSON.parse(payload);
	if (Date.now() > data.exp) return null;
	return { siswaId: data.siswaId };
}

export const Route = createFileRoute("/api/parent-data")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const parent = getParentSession(request);
				if (!parent)
					return Response.json({ error: "Unauthorized" }, { status: 401 });

				const [siswaData] = await db
					.select()
					.from(siswa)
					.where(eq(siswa.id, parent.siswaId))
					.limit(1);

				if (!siswaData)
					return Response.json({ error: "Siswa not found" }, { status: 404 });

				const [musyrifData] = siswaData.musyrifId
					? await db
							.select({
								nama: userProfile.nama,
								halaqahName: userProfile.halaqahName,
							})
							.from(userProfile)
							.where(eq(userProfile.id, siswaData.musyrifId))
							.limit(1)
					: [];

				const setoranRows = await db
					.select()
					.from(setoran)
					.where(eq(setoran.siswaId, parent.siswaId))
					.orderBy(setoran.tanggal);

				const presensiRows = await db
					.select()
					.from(presensi)
					.where(eq(presensi.siswaId, parent.siswaId))
					.orderBy(presensi.tanggal);

				return Response.json({
					siswa: {
						nama: siswaData.nama,
						hafalan: siswaData.hafalan,
						target: siswaData.target,
					},
					musyrif: musyrifData
						? { nama: musyrifData.nama, halaqahName: musyrifData.halaqahName }
						: null,
					setoran: setoranRows,
					presensi: presensiRows,
				});
			},
		},
	},
});
