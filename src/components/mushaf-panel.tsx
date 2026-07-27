import { Search02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SURAH_DATA } from "@/lib/surah-data";

interface VerseMeta {
	verse_key: string;
	chapter_id: number;
	verse_number: number;
	juz: number;
	page: number;
}

interface MushafPanelProps {
	open: boolean;
	onClose: () => void;
	onSelect: (
		surah: string,
		ayatAwal: number,
		ayatAkhir: number,
		endSurah?: string,
		endAyat?: number,
	) => void;
	mode: "input" | "read";
	initialSurah?: string;
	initialAyat?: number;
}

const TOTAL_PAGES = 604;
const SVG_BASE = "https://api.islamic.app/v1/mushaf/page";
const VERSE_BASE = "https://api.islamic.app/v1/verses/by_page";

function surahNumberToName(n: number): string {
	const s = SURAH_DATA.find((s) => s.number === n);
	return s?.name ?? `Surah ${n}`;
}

function parseAyahKey(key: string): { surah: number; ayat: number } | null {
	const parts = key.split(":");
	if (parts.length !== 2) return null;
	const surah = Number(parts[0]);
	const ayat = Number(parts[1]);
	if (!surah || !ayat) return null;
	return { surah, ayat };
}

export function MushafPanel({
	open,
	onClose,
	onSelect,
	mode,
}: MushafPanelProps) {
	const [page, setPage] = useState(1);
	const [svgHtml, setSvgHtml] = useState<string | null>(null);
	const [verses, setVerses] = useState<VerseMeta[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [startKey, setStartKey] = useState<string | null>(null);
	const [endKey, setEndKey] = useState<string | null>(null);
	const [pageInput, setPageInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<
		{ number: number; name: string }[]
	>([]);
	const [showSearch, setShowSearch] = useState(false);
	const [zoom, setZoom] = useState(100);
	const [surahJump, setSurahJump] = useState("");
	const [juzJump, setJuzJump] = useState("");
	const svgContainerRef = useRef<HTMLDivElement>(null);
	const cachedContainerRef = useRef<HTMLDivElement>(null);
	const pageCacheRef = useRef<Map<number, string>>(new Map());
	const [_cacheVersion, setCacheVersion] = useState(0);

	// Clear selection only when panel opens
	useEffect(() => {
		if (open) {
			setStartKey(null);
			setEndKey(null);
		}
	}, [open]);

	// Fetch SVG + verse metadata (page change only)
	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		setLoading(true);
		setError(null);

		// Check cache first
		const cached = pageCacheRef.current.get(page);
		if (cached) {
			setSvgHtml(cached);
			setLoading(false);
			// Still fetch verse metadata
			fetch(`${VERSE_BASE}/${page}`)
				.then((r) => r.json())
				.then((j) => {
					if (!cancelled) setVerses(j.data?.verses ?? []);
				})
				.catch(() => {});
			return () => {
				cancelled = true;
			};
		}

		Promise.all([
			fetch(`${SVG_BASE}/${page}.svg?font=uthmani&theme=light&width=720`).then(
				(r) => {
					if (!r.ok) throw new Error("SVG fetch failed");
					return r.text();
				},
			),
			fetch(`${VERSE_BASE}/${page}`)
				.then((r) => r.json())
				.then((j) => j.data?.verses ?? []),
		])
			.then(([svg, v]) => {
				if (cancelled) return;
				pageCacheRef.current.set(page, svg);
				setCacheVersion((v) => v + 1);
				setSvgHtml(svg);
				setVerses(v);
			})
			.catch(() => {
				if (!cancelled) setError("Gagal memuat halaman");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [open, page]);

	// Highlight selected ayat in SVG DOM (current + cached pages)
	// ponytail: svgHtml dependency needed — effect queries DOM after SVG renders
	useEffect(() => {
		void svgHtml; // biome false positive — svgHtml triggers re-render of DOM we query
		if (!startKey) return;

		// Parse range once
		const sParsed = parseAyahKey(startKey);
		const eParsed = endKey ? parseAyahKey(endKey) : null;
		if (!sParsed) return;

		const sNum = sParsed.surah * 1000 + sParsed.ayat;
		const eNum = eParsed ? eParsed.surah * 1000 + eParsed.ayat : null;
		const minNum = eNum !== null ? Math.min(sNum, eNum) : null;
		const maxNum = eNum !== null ? Math.max(sNum, eNum) : null;

		// Highlight tspans in a container
		const highlightIn = (root: HTMLElement) => {
			for (const tspan of root.querySelectorAll<SVGTSpanElement>(
				"tspan[data-ayah]",
			)) {
				const key = tspan.getAttribute("data-ayah");
				if (!key) continue;
				const parsed = parseAyahKey(key);
				if (!parsed) continue;
				const num = parsed.surah * 1000 + parsed.ayat;

				const inRange =
					minNum !== null && maxNum !== null
						? num >= minNum && num <= maxNum
						: num === sNum;

				if (inRange) {
					tspan.setAttribute("data-ayah-highlight", "range");
					tspan.style.fill = "#2563eb";
					tspan.style.opacity = "0.85";
				} else {
					tspan.removeAttribute("data-ayah-highlight");
					tspan.style.removeProperty("fill");
					tspan.style.removeProperty("opacity");
				}
			}
		};

		// Current page
		if (svgContainerRef.current) highlightIn(svgContainerRef.current);

		// Cached pages (hidden)
		if (cachedContainerRef.current) highlightIn(cachedContainerRef.current);
	}, [startKey, endKey, svgHtml]);

	// Event delegation for ayah clicks on SVG
	const handleSvgClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (mode !== "input") return;
			const target = e.target as HTMLElement;
			const tspan = target.closest<SVGTSpanElement>("tspan[data-ayah]");
			if (!tspan) return;

			const key = tspan.getAttribute("data-ayah");
			if (!key) return;

			if (!startKey || (startKey && endKey)) {
				// First click or reset
				setStartKey(key);
				setEndKey(null);
			} else {
				// Second click
				if (key === startKey) return;
				setEndKey(key);
			}
		},
		[startKey, endKey, mode],
	);

	const selectionSummary = useMemo(() => {
		if (!startKey || !endKey) return null;
		const sParsed = parseAyahKey(startKey);
		const eParsed = parseAyahKey(endKey);
		if (!sParsed || !eParsed) return null;

		const sNum = sParsed.surah * 1000 + sParsed.ayat;
		const eNum = eParsed.surah * 1000 + eParsed.ayat;
		const first = sNum <= eNum ? sParsed : eParsed;
		const last = sNum <= eNum ? eParsed : sParsed;

		return {
			surah: surahNumberToName(first.surah),
			surahNumber: first.surah,
			endSurahNumber: last.surah,
			ayatAwal: first.ayat,
			ayatAkhir: last.ayat,
			sameSurah: first.surah === last.surah,
		};
	}, [startKey, endKey]);

	const handleUse = useCallback(() => {
		if (!selectionSummary) return;
		const endSurah = selectionSummary.sameSurah
			? undefined
			: surahNumberToName(selectionSummary.endSurahNumber);
		onSelect(
			surahNumberToName(selectionSummary.surahNumber),
			selectionSummary.ayatAwal,
			selectionSummary.ayatAkhir,
			endSurah,
			endSurah ? selectionSummary.ayatAkhir : undefined,
		);
	}, [selectionSummary, onSelect]);

	const jumpToSurah = useCallback((surahNumber: number) => {
		const s = SURAH_DATA.find((s) => s.number === surahNumber);
		if (!s) return;
		setPage(s.pageStart);
		setShowSearch(false);
		setSearchQuery("");
	}, []);

	const handleSearch = useCallback((q: string) => {
		setSearchQuery(q);
		if (q.length < 2) {
			setSearchResults([]);
			return;
		}
		const lower = q.toLowerCase();
		const results: { number: number; name: string }[] = [];
		for (const s of SURAH_DATA) {
			if (
				s.name.toLowerCase().includes(lower) ||
				s.name.includes(q) ||
				String(s.number) === q
			) {
				results.push({ number: s.number, name: s.name });
				if (results.length >= 5) break;
			}
		}
		setSearchResults(results);
	}, []);

	const handlePageJump = useCallback(() => {
		const p = Number(pageInput);
		if (p >= 1 && p <= TOTAL_PAGES) {
			setPage(p);
			setPageInput("");
		}
	}, [pageInput]);

	if (!open) return null;

	// Get top surah from first verse on page
	const topSurah =
		verses.length > 0 ? surahNumberToName(verses[0].chapter_id) : "";
	const topJuz = verses.length > 0 ? verses[0].juz : 0;

	return (
		<div className="flex flex-col border rounded-xl overflow-hidden bg-card shadow-sm mt-3">
			{/* Header */}
			<div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
				<button
					type="button"
					onClick={() => setPage((p) => Math.max(1, p - 1))}
					disabled={page <= 1}
					className="text-xs font-medium px-2 py-1 rounded bg-background border hover:bg-accent disabled:opacity-40"
				>
					← Prev
				</button>

				<div className="flex-1 flex items-center justify-center gap-2">
					<span className="text-sm text-muted-foreground whitespace-nowrap">
						Halaman
					</span>
					<span className="text-sm font-semibold tabular-nums">{page}</span>
					<span className="text-sm text-muted-foreground">/ {TOTAL_PAGES}</span>
				</div>

				<button
					type="button"
					onClick={() => setPage((p) => Math.min(TOTAL_PAGES, p + 1))}
					disabled={page >= TOTAL_PAGES}
					className="text-xs font-medium px-2 py-1 rounded bg-background border hover:bg-accent disabled:opacity-40"
				>
					Next →
				</button>

				<div className="flex items-center gap-1 ml-2">
					<input
						type="number"
						min={1}
						max={TOTAL_PAGES}
						value={pageInput}
						onChange={(e) => setPageInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handlePageJump();
						}}
						placeholder="#"
						className="w-14 text-base text-center border rounded px-1 py-1 bg-background md:text-sm"
					/>
					<button
						type="button"
						onClick={handlePageJump}
						className="text-xs px-1.5 py-0.5 rounded bg-background border hover:bg-accent"
					>
						Go
					</button>
				</div>

				<button
					type="button"
					onClick={() => setShowSearch(!showSearch)}
					className="ml-1 p-1 rounded hover:bg-accent"
					title="Cari Surah"
				>
					<HugeiconsIcon icon={Search02Icon} className="w-3.5 h-3.5" />
				</button>
			</div>

			{/* Toolbar row 2: Surah/Juz nav + Zoom */}
			<div className="flex items-center gap-1.5 px-3 py-1.5 border-b bg-muted/30">
				<select
					value={surahJump}
					onChange={(e) => {
						const n = Number(e.target.value);
						if (n) {
							const s = SURAH_DATA.find((x) => x.number === n);
							if (s) setPage(s.pageStart);
						}
						setSurahJump("");
					}}
					className="flex-1 h-7 rounded border bg-background px-1.5 text-xs"
				>
					<option value="">Surah...</option>
					{SURAH_DATA.map((s) => (
						<option key={s.number} value={s.number}>
							{s.number}. {s.name}
						</option>
					))}
				</select>
				<select
					value={juzJump}
					onChange={(e) => {
						const n = Number(e.target.value);
						if (n) {
							const vs =
								verses.length > 0
									? verses
									: [{ juz: n, page: (n - 1) * 20 + 1 }];
							const first = vs.find((v) => v.juz >= n) ?? vs[0];
							if (first) setPage(first.page);
						}
						setJuzJump("");
					}}
					className="w-20 h-7 rounded border bg-background px-1.5 text-xs"
				>
					<option value="">Juz...</option>
					{Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
						<option key={j} value={j}>
							Juz {j}
						</option>
					))}
				</select>
				<div className="flex items-center gap-0.5 ml-auto">
					<button
						type="button"
						onClick={() => setZoom((z) => Math.max(50, z - 15))}
						className="px-1.5 py-0.5 text-xs rounded bg-background border hover:bg-accent"
					>
						−
					</button>
					<span className="text-[0.6rem] text-muted-foreground w-8 text-center tabular-nums">
						{zoom}%
					</span>
					<button
						type="button"
						onClick={() => setZoom((z) => Math.min(200, z + 15))}
						className="px-1.5 py-0.5 text-xs rounded bg-background border hover:bg-accent"
					>
						+
					</button>
				</div>
			</div>

			{/* Surah search dropdown */}
			{showSearch && (
				<div className="px-3 py-2 border-b bg-muted/30">
					<div className="relative">
						<Input
							value={searchQuery}
							onChange={(e) => handleSearch(e.target.value)}
							placeholder="Ketik nama surah atau nomor..."
							className="h-8 text-sm pr-7"
							autoFocus
						/>
						<HugeiconsIcon
							icon={Search02Icon}
							className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
						/>
					</div>
					{searchResults.length > 0 && (
						<div className="mt-1 flex flex-col gap-0.5">
							{searchResults.map((r) => (
								<button
									key={r.number}
									type="button"
									onClick={() => jumpToSurah(r.number)}
									className="text-left text-sm px-2 py-1 rounded hover:bg-accent"
								>
									{r.number}. {r.name}
								</button>
							))}
						</div>
					)}
				</div>
			)}

			{/* Top surah banner */}
			{topSurah && (
				<div className="px-3 py-1.5 border-b bg-muted/20 flex items-center gap-2">
					<span className="text-xs text-muted-foreground">{topSurah}</span>
					<span className="text-xs text-muted-foreground">· Juz {topJuz}</span>
				</div>
			)}

			{/* SVG Mushaf — interactive via event delegation on tspan[data-ayah] */}
			<div
				ref={svgContainerRef}
				onClick={handleSvgClick}
				onKeyDown={(e) => {
					if (e.key === "ArrowRight")
						setPage((p) => Math.min(TOTAL_PAGES, p + 1));
					else if (e.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
					else if (e.key === "Escape") onClose();
					else if (e.key === "Enter" || e.key === " ")
						handleSvgClick(e as unknown as React.MouseEvent<HTMLDivElement>);
				}}
				role="application"
				tabIndex={mode === "input" ? 0 : undefined}
				className={`px-3 py-3 overflow-auto ${mode === "input" ? "cursor-pointer" : ""}`}
				style={{ maxHeight: `${(zoom / 100) * 70}vh` }}
			>
				{loading && (
					<div className="text-center text-sm text-muted-foreground py-6">
						Memuat halaman {page}...
					</div>
				)}
				{error && (
					<div className="text-center text-sm text-destructive py-6">
						{error}
					</div>
				)}
				{!loading && !error && svgHtml && (
					<div
						// biome-ignore lint/security/noDangerouslySetInnerHtml: islamic.app SVGs are safe, rendered server-side
						dangerouslySetInnerHTML={{ __html: svgHtml }}
						className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
					/>
				)}
			</div>

			{/* Hidden container for cached pages (highlights applied here) */}
			<div className="hidden" ref={cachedContainerRef}>
				{Array.from(pageCacheRef.current.entries())
					.filter(([pg]) => pg !== page)
					.map(([pg, html]) => (
						<div
							key={pg}
							data-page={pg}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: islamic.app SVGs are safe
							dangerouslySetInnerHTML={{ __html: html }}
						/>
					))}
			</div>

			{/* Floating indicator when selection exists but user is on a different page */}
			{mode === "input" && startKey && !endKey && (
				<div className="px-3 py-2 border-t bg-blue-50 dark:bg-blue-950/30 flex items-center justify-between">
					<span className="text-sm text-blue-700 dark:text-blue-300">
						Ayat dipilih: {(() => {
							const p = parseAyahKey(startKey);
							return p ? `${surahNumberToName(p.surah)} ${p.ayat}` : startKey;
						})()} — tap ayat terakhir
					</span>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							setStartKey(null);
							setEndKey(null);
						}}
						className="text-xs h-6"
					>
						Batal
					</Button>
				</div>
			)}

			{/* Selection info + actions */}
			{mode === "input" && (
				<div className="px-3 py-2 border-t bg-muted/50 flex items-center justify-between">
					<div className="text-sm text-muted-foreground">
						{selectionSummary ? (
							<span>
								Terpilih:{" "}
								<span className="font-medium text-foreground">
									{selectionSummary.surah} {selectionSummary.ayatAwal}–
									{selectionSummary.ayatAkhir}
								</span>
							</span>
						) : startKey ? (
							<span className="text-xs">Tap ayat terakhir</span>
						) : (
							<span className="text-xs">Tap ayat pertama</span>
						)}
					</div>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => {
								setStartKey(null);
								setEndKey(null);
							}}
							disabled={!startKey}
						>
							Reset
						</Button>
						<Button size="sm" onClick={handleUse} disabled={!selectionSummary}>
							✓ Gunakan
						</Button>
						<Button size="sm" variant="outline" onClick={onClose}>
							Tutup
						</Button>
					</div>
				</div>
			)}
			{mode === "read" && (
				<div className="px-3 py-2 border-t bg-muted/50 flex justify-end">
					<Button size="sm" variant="outline" onClick={onClose}>
						Tutup
					</Button>
				</div>
			)}
		</div>
	);
}
