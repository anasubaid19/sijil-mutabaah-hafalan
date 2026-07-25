import { Search02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SURAH_DATA } from "@/lib/surah-data";

interface AyahData {
	number: number;
	text: string;
	surah: {
		number: number;
		name: string;
		englishName: string;
		englishNameTranslation: string;
	};
	numberInSurah: number;
	juz: number;
	page: number;
}

interface PageData {
	number: number;
	topPageSurah: {
		number: number;
		name: string;
		englishName: string;
	};
	topPageJuz: number;
	ayahs: AyahData[];
}

interface SurahSearchResult {
	number: number;
	name: string;
	englishName: string;
}

interface MushafPanelProps {
	open: boolean;
	onClose: () => void;
	onSelect: (surah: string, ayatAwal: number, ayatAkhir: number) => void;
	mode: "input" | "read";
	initialSurah?: string;
	initialAyat?: number;
}

const TOTAL_PAGES = 604;

function surahNumberToName(n: number): string {
	const s = SURAH_DATA.find((s) => s.number === n);
	return s?.name ?? `Surah ${n}`;
}

export function MushafPanel({
	open,
	onClose,
	onSelect,
	mode,
}: MushafPanelProps) {
	const [page, setPage] = useState(1);
	const [data, setData] = useState<PageData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [start, setStart] = useState<{ page: number; ayahIdx: number } | null>(
		null,
	);
	const [end, setEnd] = useState<{ page: number; ayahIdx: number } | null>(
		null,
	);
	const [pageInput, setPageInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SurahSearchResult[]>([]);
	const [showSearch, setShowSearch] = useState(false);

	// Fetch page data
	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetch(`https://api.quranhub.com/v1/page/${page}`)
			.then((r) => r.json())
			.then((json) => {
				if (cancelled) return;
				if (json.code === 200 && json.data) {
					setData(json.data);
				} else {
					setError("Gagal memuat halaman");
				}
			})
			.catch(() => {
				if (!cancelled) setError("Gagal menghubungi API");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [open, page]);

	// Reset selection on page change
	useEffect(() => {
		setStart(null);
		setEnd(null);
	}, [page]);

	const ayahs = useMemo(() => data?.ayahs ?? [], [data]);

	const handleAyahTap = useCallback(
		(idx: number) => {
			if (mode !== "input") return;
			if (!start || (start && end)) {
				setStart({ page, ayahIdx: idx });
				setEnd(null);
			} else {
				if (idx === start.ayahIdx) return;
				if (idx < start.ayahIdx) {
					setEnd({ ...start });
					setStart({ page, ayahIdx: idx });
				} else {
					setEnd({ page, ayahIdx: idx });
				}
			}
		},
		[start, end, page, mode],
	);

	const isAyahSelected = useCallback(
		(idx: number) => {
			if (!start) return false;
			if (!end) return start.page === page && start.ayahIdx === idx;
			const sIdx = start.page === page ? start.ayahIdx : -1;
			const eIdx = end.page === page ? end.ayahIdx : -1;
			if (sIdx === -1 || eIdx === -1) return false;
			return idx >= Math.min(sIdx, eIdx) && idx <= Math.max(sIdx, eIdx);
		},
		[start, end, page],
	);

	const selectionSummary = useMemo(() => {
		if (!start || !end || ayahs.length === 0) return null;
		const sAyah = ayahs[start.ayahIdx];
		const eAyah = ayahs[end.ayahIdx];
		if (!sAyah || !eAyah) return null;
		const surahName = surahNumberToName(sAyah.surah.number);
		return {
			surah: surahName,
			surahNumber: sAyah.surah.number,
			ayatAwal: sAyah.numberInSurah,
			ayatAkhir: eAyah.numberInSurah,
			sameSurah: sAyah.surah.number === eAyah.surah.number,
		};
	}, [start, end, ayahs]);

	const handleUse = useCallback(() => {
		if (!selectionSummary) return;
		onSelect(
			surahNumberToName(selectionSummary.surahNumber),
			selectionSummary.ayatAwal,
			selectionSummary.ayatAkhir,
		);
	}, [selectionSummary, onSelect]);

	const jumpToSurah = useCallback((surahNumber: number) => {
		const s = SURAH_DATA.find((s) => s.number === surahNumber);
		if (!s) return;
		const firstPage = s.juzStart;
		// Approximate: use a conservative page estimate
		// ponytail: simple heuristic — first page of juz, refine if needed
		setPage(firstPage);
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
		const results: SurahSearchResult[] = [];
		for (let i = 1; i <= 114; i++) {
			const s = SURAH_DATA.find((s) => s.number === i);
			if (!s) continue;
			if (
				s.name.toLowerCase().includes(lower) ||
				s.name.includes(q) ||
				String(s.number) === q
			) {
				results.push({
					number: s.number,
					name: s.name,
					englishName: s.name,
				});
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
						className="w-12 text-xs text-center border rounded px-1 py-0.5 bg-background"
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
			{data?.topPageSurah && (
				<div className="px-3 py-1.5 border-b bg-muted/20 flex items-center gap-2">
					<span className="text-xs text-muted-foreground">
						{data.topPageSurah.name}
						{ayahs.length > 0 &&
						ayahs[0].surah.number !== data.topPageSurah.number
							? ` – ${ayahs[0].surah.name}`
							: ""}
					</span>
					<span className="text-xs text-muted-foreground">
						· Juz {data.topPageJuz}
					</span>
				</div>
			)}

			{/* Ayahs */}
			<div className="px-3 py-3 max-h-80 overflow-y-auto">
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
				{!loading && !error && ayahs.length === 0 && (
					<div className="text-center text-sm text-muted-foreground py-6">
						Tidak ada data
					</div>
				)}
				{!loading && !error && ayahs.length > 0 && (
					<div className="space-y-2" dir="rtl">
						{ayahs.map((ayah, idx) => {
							const selected = isAyahSelected(idx);
							const isStart = start?.page === page && start.ayahIdx === idx;
							const isEnd = end?.page === page && end.ayahIdx === idx;
							const borderClass =
								isStart && isEnd
									? "ring-2 ring-primary ring-offset-1"
									: isStart
										? "ring-2 ring-primary ring-offset-ltr ring-offset-1"
										: isEnd
											? "ring-2 ring-primary ring-offset-rtl ring-offset-1"
											: selected
												? "ring-1 ring-primary/50"
												: "";
							return (
								<button
									key={ayah.number}
									type="button"
									onClick={() => handleAyahTap(idx)}
									className={`w-full text-left p-3 rounded-lg border transition-all ${
										mode === "input"
											? "cursor-pointer hover:bg-accent/50"
											: "cursor-default"
									} ${
										selected
											? "bg-primary/5 border-primary/30"
											: "bg-background"
									} ${borderClass}`}
								>
									<div className="font-arabic text-xl leading-loose text-foreground">
										{ayah.text}
										<span className="inline-flex items-center justify-center w-7 h-7 mr-2 text-xs font-sans bg-primary/10 text-primary rounded-full align-middle">
											{ayah.numberInSurah}
										</span>
									</div>
									{ayah.surah.englishName !== ayahs[0]?.surah.englishName && (
										<div className="text-xs text-muted-foreground mt-1 mr-2">
											— {ayah.surah.name}
										</div>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>

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
						) : start ? (
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
								setStart(null);
								setEnd(null);
							}}
							disabled={!start}
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
