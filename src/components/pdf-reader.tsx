import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface PdfDocument {
	numPages: number;
	getPage: (pageNumber: number) => Promise<PdfPage>;
}

interface PdfPage {
	getViewport: (options: { scale: number }) => {
		width: number;
		height: number;
	};
	render: (options: {
		canvas: HTMLCanvasElement;
		canvasContext: CanvasRenderingContext2D;
		viewport: { width: number; height: number };
		transform?: number[];
	}) => { promise: Promise<void>; cancel: () => void };
}

interface PdfReaderProps {
	url: string;
}

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export function PdfReader({ url }: PdfReaderProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const renderTaskRef = useRef<{
		promise: Promise<void>;
		cancel: () => void;
	} | null>(null);
	const [document, setDocument] = useState<PdfDocument | null>(null);
	const [page, setPage] = useState(1);
	const [zoom, setZoom] = useState(1);
	const [containerWidth, setContainerWidth] = useState(0);
	const [canvasSize, setCanvasSize] = useState({
		cssWidth: 0,
		cssHeight: 0,
		pixelWidth: 0,
		pixelHeight: 0,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [retryKey, setRetryKey] = useState(0);

	useEffect(() => {
		let cancelled = false;
		let loadingTask: { promise: Promise<PdfDocument>; destroy: () => void } | null =
			null;

		setLoading(true);
		setError(false);
		setDocument(null);
		setPage(1);
		setZoom(1);

		async function load() {
			try {
				const pdfjs = await import("pdfjs-dist");
				pdfjs.GlobalWorkerOptions.workerSrc = new URL(
					"pdfjs-dist/build/pdf.worker.min.mjs",
					import.meta.url,
				).toString();
				const task = pdfjs.getDocument({ url }) as unknown as {
					promise: Promise<PdfDocument>;
					destroy: () => void;
				};
				loadingTask = task;
				const loadedDocument = await task.promise;
				if (cancelled) {
					task.destroy();
					return;
				}
				setDocument(loadedDocument);
			} catch {
				if (!cancelled) setError(true);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
			loadingTask?.destroy();
		};
	}, [url, retryKey]);

	useEffect(() => {
		const element = viewportRef.current;
		if (!element) return;
		const updateWidth = () => setContainerWidth(Math.max(0, element.clientWidth - 24));
		updateWidth();
		const observer = new ResizeObserver(updateWidth);
		observer.observe(element);
		return () => observer.disconnect();
	}, [document]);

	useEffect(() => {
		if (!document || !containerWidth || !canvasRef.current) return;
		const pdfDocument = document;
		let cancelled = false;
		let renderTask: { promise: Promise<void>; cancel: () => void } | null = null;

		async function renderPage() {
			try {
				const previousTask = renderTaskRef.current;
				if (previousTask) {
					previousTask.cancel();
					await previousTask.promise.catch(() => undefined);
				}
				if (cancelled) return;
				const pdfPage = await pdfDocument.getPage(page);
				if (cancelled || !canvasRef.current) return;
				const naturalViewport = pdfPage.getViewport({ scale: 1 });
				const scale = (containerWidth / naturalViewport.width) * zoom;
				const viewport = pdfPage.getViewport({ scale });
				const outputScale = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
				const nextSize = {
					cssWidth: Math.floor(viewport.width),
					cssHeight: Math.floor(viewport.height),
					pixelWidth: Math.floor(viewport.width * outputScale),
					pixelHeight: Math.floor(viewport.height * outputScale),
				};
				if (
					canvasSize.cssWidth !== nextSize.cssWidth ||
					canvasSize.cssHeight !== nextSize.cssHeight ||
					canvasSize.pixelWidth !== nextSize.pixelWidth ||
					canvasSize.pixelHeight !== nextSize.pixelHeight
				) {
					setCanvasSize(nextSize);
					return;
				}
				const canvas = canvasRef.current;
				const context = canvas.getContext("2d", { alpha: false });
				if (!context) throw new Error("Canvas context unavailable");
				renderTask = pdfPage.render({
					canvas,
					canvasContext: context,
					viewport,
					transform:
						outputScale === 1
							? undefined
							: [outputScale, 0, 0, outputScale, 0, 0],
				});
				renderTaskRef.current = renderTask;
				await renderTask.promise;
			} catch (renderError) {
				if (
					!cancelled &&
					(!(renderError instanceof Error) ||
						renderError.name !== "RenderingCancelledException")
				) {
					setError(true);
				}
			}
		}

		void renderPage();
		return () => {
			cancelled = true;
			renderTask?.cancel();
		};
	}, [canvasSize, containerWidth, document, page, zoom]);

	const previousPage = useCallback(() => {
		setPage((current) => Math.max(1, current - 1));
	}, []);
	const nextPage = useCallback(() => {
		setPage((current) => Math.min(document?.numPages ?? current, current + 1));
	}, [document]);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			const target = event.target;
			if (
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				target instanceof HTMLSelectElement
			) {
				return;
			}
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				previousPage();
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				nextPage();
			}
		}
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [nextPage, previousPage]);

	if (loading) {
		return (
			<div className="flex h-full flex-col gap-3 p-3" aria-busy="true" aria-label="Memuat PDF">
				<div className="h-9 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
				<div className="mx-auto aspect-[3/4] w-full max-w-lg animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
			</div>
		);
	}

	if (error || !document) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
				<p className="text-sm font-medium">Gagal memuat PDF</p>
				<Button variant="outline" size="sm" onClick={() => setRetryKey((key) => key + 1)}>
					Coba lagi
				</Button>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-col bg-muted/30">
			<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background/95 p-2">
				<div className="flex items-center gap-1">
					<Button size="icon-sm" variant="outline" onClick={previousPage} disabled={page === 1} aria-label="Halaman sebelumnya">
						<span aria-hidden>‹</span>
					</Button>
					<span className="min-w-14 text-center text-xs font-medium tabular-nums" aria-live="polite">
						{page}/{document.numPages}
					</span>
					<Button size="icon-sm" variant="outline" onClick={nextPage} disabled={page === document.numPages} aria-label="Halaman berikutnya">
						<span aria-hidden>›</span>
					</Button>
				</div>
				<div className="flex items-center gap-1">
					<Button size="icon-sm" variant="outline" onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))} disabled={zoom <= MIN_ZOOM} aria-label="Perkecil PDF">
						<span aria-hidden>−</span>
					</Button>
					<Button size="sm" variant="outline" onClick={() => setZoom(1)} aria-label="Sesuaikan PDF ke lebar">
						{zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}%`}
					</Button>
					<Button size="icon-sm" variant="outline" onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))} disabled={zoom >= MAX_ZOOM} aria-label="Perbesar PDF">
						<span aria-hidden>+</span>
					</Button>
				</div>
			</div>

			<div ref={viewportRef} className="min-h-0 flex-1 overflow-auto p-3">
				<div key={page} className="mx-auto flex min-h-full w-fit items-start justify-center animate-in fade-in duration-fast motion-reduce:animate-none">
					<canvas
						ref={canvasRef}
						width={canvasSize.pixelWidth || undefined}
						height={canvasSize.pixelHeight || undefined}
						style={{
							width: canvasSize.cssWidth || undefined,
							height: canvasSize.cssHeight || undefined,
						}}
						className="block max-w-none bg-white shadow-sm"
						aria-label={`Halaman ${page} dari ${document.numPages}`}
					/>
				</div>
			</div>
		</div>
	);
}
