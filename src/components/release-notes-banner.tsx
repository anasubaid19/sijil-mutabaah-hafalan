import { Cancel01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import {
	RELEASES,
	type UnseenRelease,
	selectUnseenRelease,
} from "@/lib/release-notes";

const STORAGE_KEY = "sijil_release_seen_id";

function formatReleaseDate(date: string) {
	// Tengah hari lokal supaya tanggal tidak bergeser ke hari sebelumnya.
	return new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function ReleaseNotesBanner() {
	const [release, setRelease] = useState<UnseenRelease | null>(null);

	useEffect(() => {
		const lastSeen = localStorage.getItem(STORAGE_KEY);
		if (lastSeen === RELEASES[0]?.id) return;

		const unseen = selectUnseenRelease(RELEASES, lastSeen);
		if (!unseen) {
			// Tidak ada poin untuk ditampilkan; tetap catat rilis terbaru supaya
			// rilis lama tidak muncul lagi di pembaruan berikutnya.
			if (RELEASES[0]) localStorage.setItem(STORAGE_KEY, RELEASES[0].id);
			return;
		}
		setRelease(unseen);
	}, []);

	function dismiss() {
		if (release) localStorage.setItem(STORAGE_KEY, release.acknowledgeId);
		setRelease(null);
	}

	if (!release) return null;

	return (
		<section
			aria-label="Informasi perubahan aplikasi"
			className="flex items-start gap-3 border-b border-info/20 bg-info-subtle px-3 py-3 text-info-subtle-foreground md:px-6"
		>
			<HugeiconsIcon
				icon={InformationCircleIcon}
				strokeWidth={1.8}
				className="mt-0.5 size-5 shrink-0"
				aria-hidden
			/>
			<div className="min-w-0 flex-1 space-y-1.5">
				<p className="text-sm font-semibold">
					Yang baru di Sijil ·{" "}
					<span className="font-normal">
						{formatReleaseDate(release.date)}
					</span>
				</p>
				<p className="text-sm font-medium">{release.title}</p>
				<ul className="space-y-1 text-sm">
					{release.items.map((item) => (
						<li
							key={`${item.kind}-${item.text}`}
							className="flex flex-wrap items-baseline gap-x-2"
						>
							<span className="rounded-full bg-info/15 px-2 py-0.5 text-[11px] font-medium">
								{item.kind}
							</span>
							<span className="min-w-0">{item.text}</span>
						</li>
					))}
				</ul>
				{release.hiddenCount > 0 && (
					<p className="text-xs opacity-80">
						+{release.hiddenCount} perubahan lain juga sudah aktif.
					</p>
				)}
			</div>
			<button
				type="button"
				onClick={dismiss}
				aria-label="Tutup info perubahan"
				className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-info/15 active:bg-info/25"
			>
				<HugeiconsIcon
					icon={Cancel01Icon}
					strokeWidth={2}
					className="size-4"
					aria-hidden
				/>
			</button>
		</section>
	);
}
