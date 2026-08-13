# PDF Reader Verification

Date: 2026-08-13  
Target: local QA server backed by `sijil_qa`

## Results

| Check | iPhone 390×844 | Desktop 1440×900 |
|---|---:|---:|
| Fit-width canvas | 284px canvas / 308px viewport | 694px canvas / 718px viewport |
| Document horizontal overflow | No | No |
| Zoom in | 284px → 355px | 694px → 867px |
| Previous/next buttons | Pass | Pass |
| ArrowLeft/ArrowRight | Pass | Pass |
| Fit reset | Pass | Pass |
| Console errors | 0 | 0 |

- PDF: 8 pages detected and navigated.
- Device pixel ratio is capped at 2 in the reader implementation.
- `prefers-reduced-motion: reduce` was detected and the page fade is disabled by
  `motion-reduce:animate-none`.
- Forced PDF request failure displayed “Gagal memuat PDF” and a visible “Coba
  lagi” action.
- Generated report preview rendered through the same reader from its object/blob
  URL at 284px inside a 308px viewport, without document overflow.
- Production build emitted a hashed PDF.js worker asset:
  `pdf.worker.min-*.mjs`.

## Evidence

- [Before — native iframe on iPhone](pdf-reader-before-iphone.png)
- [After — reader on iPhone](pdf-reader-after-iphone.png)
- [After — reader on desktop](pdf-reader-after-desktop.png)
- [Error and retry state](pdf-reader-error-iphone.png)
- [Generated report/blob preview](pdf-reader-blob-preview-iphone.png)
- [Machine-readable verification](pdf-reader-verification.json)
