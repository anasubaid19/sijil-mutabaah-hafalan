#!/usr/bin/env python3
"""
PDF generator using reportlab — modern executive-report style.
Minimalist design with generous whitespace, subtle dividers, and clean typography.

Usage:
  python3 scripts/generate-pdf.py --content content.json --out report.pdf
"""

import json
import sys
import argparse
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)

# ─── Design Tokens ──────────────────────────────────────────────────────────

PRIMARY   = "#2563eb"
TINT      = "#eff6ff"
WHITE     = "#ffffff"
GRAY_50   = "#f9fafb"
GRAY_100  = "#f3f4f6"
GRAY_200  = "#e5e7eb"
GRAY_300  = "#d1d5db"
GRAY_400  = "#9ca3af"
GRAY_600  = "#4b5563"
GRAY_800  = "#1f2937"

MARGIN       = 20 * mm
PAGE_W, PAGE_H = A4
LANDSCAPE = landscape(A4)

FONT     = "Helvetica"
FONT_B   = "Helvetica-Bold"
FONT_O   = "Helvetica-Oblique"


def hex_to_color(h):
    return HexColor(h)


# ─── Paragraph Helpers ──────────────────────────────────────────────────────

def escape_xml(text):
    return (str(text)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


def format_inline(text):
    t = escape_xml(text)
    t = t.replace("&lt;b&gt;", "<b>").replace("&lt;/b&gt;", "</b>")
    t = t.replace("&lt;i&gt;", "<i>").replace("&lt;/i&gt;", "</i>")
    t = t.replace("&lt;u&gt;", "<u>").replace("&lt;/u&gt;", "</u>")
    return t


def P(text, size=9, bold=False, color=GRAY_800, align=TA_LEFT, leading=None, indent=0, obl=False):
    """Quick Paragraph factory."""
    fn = FONT_O if obl else (FONT_B if bold else FONT)
    lh = leading or size * 1.5
    return Paragraph(format_inline(text), ParagraphStyle(
        f"_{id(text)}_{size}_{bold}", fontSize=size, leading=lh,
        textColor=hex_to_color(color), fontName=fn, alignment=align,
        leftIndent=indent,
    ))


# ─── Table Builder ──────────────────────────────────────────────────────────

def build_table(headers, rows, style="detail"):
    """
    Build a styled table.
    style: "summary" — all rows tinted + bold | "detail" — zebra rows
    """
    n_cols = len(headers)
    is_landscape = n_cols > 5
    available = (PAGE_W if is_landscape else PAGE_W) - 2 * MARGIN
    col_w = available / n_cols

    # Header row
    header_cells = [P(h, size=8, bold=True, color=GRAY_600, align=TA_CENTER) for h in headers]
    data = [header_cells]

    # Body rows — detect numeric columns (heuristic: column name contains "ayat", "setoran", "juz")
    numeric_cols = set()
    for ci, h in enumerate(headers):
        hl = h.lower()
        if any(kw in hl for kw in ["ayat", "setoran", "juz", "tanggal", "jumlah", "total", "umur"]):
            numeric_cols.add(ci)

    for ri, row in enumerate(rows):
        cells = []
        for ci, cell in enumerate(row):
            align = TA_RIGHT if ci in numeric_cols else TA_LEFT
            is_summary = style == "summary"
            cells.append(P(str(cell), size=9, bold=is_summary, align=align))
        data.append(cells)

    col_widths = [col_w] * n_cols
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.hAlign = "LEFT"

    style_cmds = [
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), hex_to_color(GRAY_100)),
        ("FONTNAME", (0, 0), (-1, 0), FONT_B),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("TEXTCOLOR", (0, 0), (-1, 0), hex_to_color(GRAY_600)),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("LINEBELOW", (0, 0), (-1, 0), 1, hex_to_color(GRAY_300)),
        # All cells
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        # No grid — only bottom lines
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, hex_to_color(GRAY_200)),
        ("LINEABOVE", (0, 0), (-1, -1), 0, white),
        ("LINEBEFORE", (0, 0), (-1, -1), 0, white),
        ("LINEAFTER", (0, 0), (-1, -1), 0, white),
        # Remove header's bottom from the grid override
        ("LINEBELOW", (0, 0), (-1, 0), 1, hex_to_color(GRAY_300)),
    ]

    if style == "summary":
        for ri in range(1, len(data)):
            style_cmds.append(("BACKGROUND", (0, ri), (-1, ri), hex_to_color(TINT)))
            style_cmds.append(("LINEABOVE", (0, ri), (-1, ri), 1, hex_to_color(PRIMARY)))
    else:
        # Zebra striping for detail tables
        for ri in range(1, len(data)):
            if ri % 2 == 0:
                style_cmds.append(("BACKGROUND", (0, ri), (-1, ri), hex_to_color(GRAY_50)))

    table.setStyle(TableStyle(style_cmds))
    return table, is_landscape


# ─── Content Builder ────────────────────────────────────────────────────────

def build_body(content):
    """Convert content.json blocks to flowables. Returns (elements, needs_landscape)."""
    elements = []
    needs_landscape = False
    number_counter = 0

    for block in content:
        btype = block.get("type", "body")
        text = block.get("text", "")

        if btype == "h3":
            number_counter = 0
            elements.append(Spacer(1, 8))
            elements.append(HRFlowable(width="100%", thickness=0.5,
                                       color=hex_to_color(GRAY_200),
                                       spaceAfter=4, spaceBefore=0))
            elements.append(P(text, size=11, bold=True, color=GRAY_800))
            elements.append(Spacer(1, 4))

        elif btype == "h2":
            number_counter = 0
            elements.append(Spacer(1, 10))
            elements.append(P(text, size=13, bold=True, color=PRIMARY))
            elements.append(Spacer(1, 4))

        elif btype == "body":
            elements.append(P(text, size=9, color=GRAY_600))
            elements.append(Spacer(1, 4))

        elif btype == "bullet":
            elements.append(P(f"•  {text}", size=9, color=GRAY_600, indent=12))
            elements.append(Spacer(1, 2))

        elif btype == "numbered":
            number_counter += 1
            elements.append(P(f"{number_counter}.  {text}", size=9, color=GRAY_600, indent=12))
            elements.append(Spacer(1, 2))

        elif btype == "callout":
            elements.append(Spacer(1, 4))
            t = Table([[P(text, size=9, obl=True, color=GRAY_600)]],
                      colWidths=[PAGE_W - 2 * MARGIN - 4 * mm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), hex_to_color(TINT)),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBEFORE", (0, 0), (0, 0), 4, hex_to_color(PRIMARY)),
                ("LINEBELOW", (0, 0), (-1, -1), 0, white),
                ("LINEABOVE", (0, 0), (-1, -1), 0, white),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 4))

        elif btype == "table":
            headers = block.get("headers", [])
            rows = block.get("rows", [])
            style = block.get("style", "detail")
            if headers and rows:
                elements.append(Spacer(1, 6))
                tbl, is_land = build_table(headers, rows, style)
                if is_land:
                    needs_landscape = True
                elements.append(tbl)
                elements.append(Spacer(1, 10))

        elif btype == "divider":
            elements.append(Spacer(1, 4))
            elements.append(HRFlowable(width="100%", thickness=0.5,
                                       color=hex_to_color(GRAY_200),
                                       spaceAfter=4))

        elif btype == "spacer":
            elements.append(Spacer(1, block.get("pt", 10)))

        elif btype == "pagebreak":
            elements.append(PageBreak())

        elif btype == "caption":
            elements.append(P(text, size=7, obl=True, color=GRAY_400, align=TA_CENTER))
            elements.append(Spacer(1, 2))

    return elements, needs_landscape


# ─── Page Template Callbacks ─────────────────────────────────────────────────

def _build_page_callbacks(orientation):
    W, H = orientation

    def on_page(canvas, doc):
        canvas.saveState()

        # Header on first page
        if doc.page == 1:
            canvas.setFillColor(hex_to_color(GRAY_100))
            canvas.setStrokeColor(hex_to_color(GRAY_100))
            canvas.rect(0, H - 24 * mm, W, 24 * mm, fill=1, stroke=0)
            canvas.setFillColor(hex_to_color(GRAY_200))
            canvas.rect(0, H - 24 * mm, W, 0.5, fill=1, stroke=0)

            title = getattr(doc, "_pdf_title", "Sijil Mutaba'ah")
            canvas.setFont(FONT_B, 16)
            canvas.setFillColor(hex_to_color(PRIMARY))
            canvas.drawString(MARGIN, H - 18 * mm, title)

            if hasattr(doc, "_pdf_subtitle") and doc._pdf_subtitle:
                canvas.setFont(FONT, 10)
                canvas.setFillColor(hex_to_color(GRAY_600))
                canvas.drawString(MARGIN, H - 21.5 * mm, doc._pdf_subtitle)

            if hasattr(doc, "_pdf_date") and doc._pdf_date:
                canvas.setFont(FONT, 9)
                canvas.setFillColor(hex_to_color(GRAY_400))
                canvas.drawRightString(W - MARGIN, H - 18 * mm, doc._pdf_date)

        # Header on subsequent pages
        if doc.page > 1:
            app_title = getattr(doc, "_pdf_title", "Sijil Mutaba'ah")
            canvas.setFont(FONT_O, 7)
            canvas.setFillColor(hex_to_color(GRAY_400))
            canvas.drawString(MARGIN, H - 10 * mm, app_title)
            canvas.setStrokeColor(hex_to_color(GRAY_200))
            canvas.setLineWidth(0.5)
            canvas.line(MARGIN, H - 12 * mm, W - MARGIN, H - 12 * mm)

        # Footer — page number
        canvas.setFont(FONT, 7)
        canvas.setFillColor(hex_to_color(GRAY_400))
        canvas.drawCentredString(W / 2, 12 * mm, f"Hal. {doc.page}")

        # Footer — branding
        canvas.drawRightString(W - MARGIN, 12 * mm, "Sijil Mutaba'ah")

        canvas.restoreState()

    return on_page


# ─── Main Generator ─────────────────────────────────────────────────────────

def generate_pdf(title, subtitle, date, content, out_path):
    # Build body first to detect landscape needs
    elements, needs_landscape = build_body(content)

    # Choose orientation
    orientation = LANDSCAPE if needs_landscape else A4
    W, H = orientation

    # Prepend clean title block
    title_elements = [
        Spacer(1, 28 * mm),  # push below header band
    ]
    # No separate cover — the page callback draws the header band

    elements = title_elements + elements

    doc = SimpleDocTemplate(
        out_path,
        pagesize=orientation,
        topMargin=28 * mm,
        bottomMargin=20 * mm,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        title=title,
    )

    # Attach metadata for page callbacks
    doc._pdf_title = title
    doc._pdf_subtitle = subtitle
    doc._pdf_date = date

    cb = _build_page_callbacks(orientation)
    doc.build(elements, onFirstPage=cb, onLaterPages=cb)


def main():
    parser = argparse.ArgumentParser(description="Generate modern executive-report PDF")
    parser.add_argument("--title", default="Laporan Sijil Mutaba'ah")
    parser.add_argument("--subtitle", default="")
    parser.add_argument("--date", default="")
    parser.add_argument("--content", default=None)
    parser.add_argument("--out", default="output.pdf")
    args = parser.parse_args()

    if args.content:
        with open(args.content) as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    if isinstance(data, list):
        content = data
    else:
        content = data.get("content", [])
        args.title = data.get("title", args.title)
        args.subtitle = data.get("subtitle", args.subtitle)
        args.date = data.get("date", args.date)

    generate_pdf(
        title=args.title,
        subtitle=args.subtitle,
        date=args.date,
        content=content,
        out_path=args.out,
    )
    print(f"PDF written to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
