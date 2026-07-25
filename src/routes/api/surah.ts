import { createFileRoute } from "@tanstack/react-router";
import { SURAH_DATA, searchSurah } from "@/lib/surah-data";

export const Route = createFileRoute("/api/surah")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const { searchParams } = new URL(request.url);
				const q = searchParams.get("q");
				const rows = q ? searchSurah(q) : SURAH_DATA;
				return Response.json(rows);
			},
		},
	},
});
