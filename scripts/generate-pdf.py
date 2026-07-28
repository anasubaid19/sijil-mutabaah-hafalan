#!/usr/bin/env python3
"""
A4 Portrait school-report PDF generator.
"""

import base64
import json
import sys
import argparse
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from PIL import Image as PILImage

PRIMARY   = "#2563eb"
WHITE     = "#ffffff"
GRAY_50   = "#f9fafb"
GRAY_100  = "#f3f4f6"
GRAY_200  = "#e5e7eb"
GRAY_300  = "#d1d5db"
GRAY_400  = "#9ca3af"
GRAY_600  = "#4b5563"
GRAY_800  = "#1f2937"

MARGIN  = 18 * mm
PAGE_W, PAGE_H = A4

FONT   = "Helvetica"
FONT_B = "Helvetica-Bold"
FONT_O = "Helvetica-Oblique"

def hex_to_color(h):
    return HexColor(h)

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

def P(text, size=9, bold=False, color=GRAY_800, align=TA_LEFT, leading=None, obl=False):
    fn = FONT_O if obl else (FONT_B if bold else FONT)
    lh = leading or size * 1.5
    return Paragraph(format_inline(text), ParagraphStyle(
        f"_s{id(text)}_{size}_{bold}", fontSize=size, leading=lh,
        textColor=hex_to_color(color), fontName=fn, alignment=align,
    ))

# ─── School Profile Header ───────────────────────────────────────────────────

def decode_logo(logo_b64):
    if not logo_b64:
        return None
    try:
        if logo_b64.startswith("data:image/"):
            _, b64data = logo_b64.split(",", 1)
        else:
            b64data = logo_b64
        raw = base64.b64decode(b64data)
        return PILImage.open(BytesIO(raw))
    except Exception:
        return None


def render_school_header(doc, canvas, W, H):
    logo = getattr(doc, "_school_logo", "")
    foundation = getattr(doc, "_school_foundation", "").strip()
    school = getattr(doc, "_school_name", "").strip()
    periode = getattr(doc, "_periode", "")
    date_str = getattr(doc, "_pdf_date", "")

    has_logo = bool(logo)
    has_foundation = bool(foundation)
    has_school = bool(school)
    has_any_text = has_foundation or has_school

    header_h = 22 * mm
    if not has_logo and not has_any_text:
        return None

    # Header background
    canvas.setFillColor(hex_to_color(GRAY_100))
    canvas.setStrokeColor(hex_to_color(GRAY_200))
    canvas.rect(0, H - header_h, W, header_h, fill=1, stroke=1)

    left_x = MARGIN
    right_x = W - MARGIN

    # Logo
    logo_img = None
    if has_logo:
        logo_img = decode_logo(logo)
        if logo_img:
            logo_w, logo_h = logo_img.size
            target_h = 18 * mm
            scale = target_h / max(logo_h, 1)
            draw_w = logo_w * scale
            canvas.drawInlineImage(
                logo_img, left_x, H - 20 * mm,
                width=draw_w, height=target_h,
            )
            left_x += draw_w + 6 * mm
        else:
            has_logo = False

    # Text block
    text_x = left_x
    y = H - 6 * mm

    if has_foundation and has_school:
        canvas.setFont(FONT_B, 13)
        canvas.setFillColor(hex_to_color(GRAY_800))
        canvas.drawString(text_x, y, foundation)
        y -= 5 * mm
        canvas.setFont(FONT, 9)
        canvas.setFillColor(hex_to_color(GRAY_600))
        canvas.drawString(text_x, y, school)
        y -= 5 * mm
    elif has_foundation:
        canvas.setFont(FONT_B, 13)
        canvas.setFillColor(hex_to_color(GRAY_800))
        canvas.drawString(text_x, y, foundation)
        y -= 5 * mm
    elif has_school:
        canvas.setFont(FONT_B, 14)
        canvas.setFillColor(hex_to_color(GRAY_800))
        canvas.drawString(text_x, y, school)
        y -= 5 * mm

    # "Laporan Hafalan Al-Qur'an"
    canvas.setFont(FONT, 8)
    canvas.setFillColor(hex_to_color(GRAY_400))
    canvas.drawString(text_x, y, "Laporan Hafalan Al-Qur'an")

    # Period
    if periode:
        y -= 4 * mm
        canvas.setFont(FONT_O, 7)
        canvas.setFillColor(hex_to_color(GRAY_400))
        canvas.drawString(text_x, y, f"Periode: {periode}")

    # Right side — date
    if date_str:
        canvas.setFont(FONT, 7)
        canvas.setFillColor(hex_to_color(GRAY_400))
        canvas.drawRightString(right_x, H - 8 * mm, date_str)

    return H - header_h


# ─── Student Info Card ───────────────────────────────────────────────────────

def build_student_info(doc):
    halaqah = getattr(doc, "_halaqah_name", "")
    guru = getattr(doc, "_guru_name", "")
    siswa = getattr(doc, "_siswa_name", "")
    periode = getattr(doc, "_periode", "")
    date_str = getattr(doc, "_pdf_date", "")

    if not halaqah and not guru and not siswa:
        return None

    card_data = [
        [P("Nama Halaqah", size=8, bold=True, color=GRAY_600, align=TA_LEFT),
         P(halaqah, size=8, color=GRAY_800, align=TA_LEFT),
         P("Nama Guru", size=8, bold=True, color=GRAY_600, align=TA_LEFT),
         P(guru, size=8, color=GRAY_800, align=TA_LEFT)],
    ]

    second_row = []
    kolom_tersisa = 4
    if siswa:
        second_row.append(P("Nama Siswa", size=8, bold=True, color=GRAY_600, align=TA_LEFT))
        second_row.append(P(siswa, size=8, color=GRAY_800, align=TA_LEFT))
        kolom_tersisa -= 2
    if periode or date_str:
        label = "Periode" if periode else "Tanggal"
        val = periode if periode else date_str
        second_row.append(P(label, size=8, bold=True, color=GRAY_600, align=TA_LEFT))
        second_row.append(P(val, size=8, color=GRAY_800, align=TA_LEFT))
        kolom_tersisa -= 2
    while kolom_tersisa > 0:
        second_row.append(P("", size=8, color=GRAY_800, align=TA_LEFT))
        kolom_tersisa -= 1

    card_data.append(second_row)

    available = PAGE_W - 2 * MARGIN - 4 * mm
    col_w = available / 4

    t = Table(card_data, colWidths=[col_w] * 4)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), hex_to_color(GRAY_50)),
        ("BOX", (0, 0), (-1, -1), 0.5, hex_to_color(GRAY_200)),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEAFTER", (1, 0), (1, -1), 0.5, hex_to_color(GRAY_200)),
        ("LINEAFTER", (2, 0), (2, 0), 0.5, hex_to_color(GRAY_200)),
    ]))
    return t


# ─── Summary Cards ───────────────────────────────────────────────────────────

def build_summary_cards(doc):
    total_setoran = getattr(doc, "_total_setoran", 0)
    total_ayat = getattr(doc, "_total_ayat", 0)
    total_halaman = getattr(doc, "_total_halaman", 0)
    current_juz = getattr(doc, "_current_juz", "-")
    terakhir = getattr(doc, "_last_memorization", "-")

    if not total_setoran:
        return None

    cards = [
        (total_setoran, "Setoran"),
        (total_ayat, "Ayat"),
        (total_halaman, "Halaman"),
        (current_juz, "Juz"),
        (terakhir, "Terakhir"),
    ]

    available = PAGE_W - 2 * MARGIN
    gap = 4 * mm
    n = len(cards)
    card_w = (available - gap * (n - 1)) / n

    row = []
    for val, label in cards:
        val_text = P(str(val), size=11, bold=True, color=PRIMARY, align=TA_CENTER)
        lbl_text = P(label, size=7, color=GRAY_400, align=TA_CENTER)
        inner = Table([[val_text], [lbl_text]], colWidths=[card_w])
        inner.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, 0), 4),
            ("RIGHTPADDING", (0, 0), (-1, 0), 4),
        ]))
        row.append(inner)

    # Wrap each card in a bordered box
    # We use an outer table with border per cell
    outer = Table([row], colWidths=[card_w] * n)
    style_cmds = [
        ("BOX", (0, 0), (-1, 0), 0.5, hex_to_color(GRAY_200)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]
    outer.setStyle(TableStyle(style_cmds))
    return outer


# ─── Table Builder ──────────────────────────────────────────────────────────

def build_table(headers, rows, style="detail"):
    n_cols = len(headers)
    available = PAGE_W - 2 * MARGIN
    col_w = available / n_cols

    header_cells = [P(h, size=7, bold=True, color=GRAY_600, align=TA_CENTER) for h in headers]
    data = [header_cells]

    numeric_cols = set()
    for ci, h in enumerate(headers):
        hl = h.lower()
        if any(kw in hl for kw in ["ayat", "setoran", "juz", "tanggal", "jumlah", "total", "umur", "halaman"]):
            numeric_cols.add(ci)

    for ri, row in enumerate(rows):
        cells = []
        for ci, cell in enumerate(row):
            align = TA_RIGHT if ci in numeric_cols else TA_LEFT
            is_summary = style == "summary"
            cells.append(P(str(cell), size=8, bold=is_summary, align=align))
        data.append(cells)

    col_widths = [col_w] * n_cols
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.hAlign = "LEFT"

    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), hex_to_color(GRAY_100)),
        ("FONTNAME", (0, 0), (-1, 0), FONT_B),
        ("FONTSIZE", (0, 0), (-1, 0), 7),
        ("TEXTCOLOR", (0, 0), (-1, 0), hex_to_color(GRAY_600)),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("TOPPADDING", (0, 0), (-1, 0), 5),
        ("LINEBELOW", (0, 0), (-1, 0), 1, hex_to_color(GRAY_300)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, hex_to_color(GRAY_200)),
        ("LINEABOVE", (0, 0), (-1, -1), 0, white),
        ("LINEBEFORE", (0, 0), (-1, -1), 0, white),
        ("LINEAFTER", (0, 0), (-1, -1), 0, white),
        ("LINEBELOW", (0, 0), (-1, 0), 1, hex_to_color(GRAY_300)),
    ]

    if style == "summary":
        for ri in range(1, len(data)):
            style_cmds.append(("BACKGROUND", (0, ri), (-1, ri), hex_to_color(GRAY_50)))
            style_cmds.append(("LINEABOVE", (0, ri), (-1, ri), 0.5, hex_to_color(PRIMARY)))
    else:
        for ri in range(1, len(data)):
            if ri % 2 == 0:
                style_cmds.append(("BACKGROUND", (0, ri), (-1, ri), hex_to_color(GRAY_50)))

    table.setStyle(TableStyle(style_cmds))
    return table


# ─── Content Builder ─────────────────────────────────────────────────────────

def build_body(content):
    elements = []
    for block in content:
        btype = block.get("type", "body")
        text = block.get("text", "")

        if btype == "h3":
            elements.append(Spacer(1, 6))
            elements.append(HRFlowable(width="100%", thickness=0.5,
                                       color=hex_to_color(GRAY_200),
                                       spaceAfter=4, spaceBefore=0))
            elements.append(P(text, size=10, bold=True, color=GRAY_800))
            elements.append(Spacer(1, 3))

        elif btype == "h2":
            elements.append(Spacer(1, 8))
            elements.append(P(text, size=12, bold=True, color=PRIMARY))
            elements.append(Spacer(1, 4))

        elif btype == "body":
            elements.append(P(text, size=9, color=GRAY_600))
            elements.append(Spacer(1, 3))

        elif btype == "bullet":
            elements.append(P(f"•  {text}", size=9, color=GRAY_600, indent=12))
            elements.append(Spacer(1, 2))

        elif btype == "divider":
            elements.append(Spacer(1, 3))
            elements.append(HRFlowable(width="100%", thickness=0.5,
                                       color=hex_to_color(GRAY_200), spaceAfter=3))

        elif btype == "table":
            headers = block.get("headers", [])
            rows = block.get("rows", [])
            style = block.get("style", "detail")
            if headers and rows:
                elements.append(Spacer(1, 4))
                elements.append(build_table(headers, rows, style))
                elements.append(Spacer(1, 8))

        elif btype == "pagebreak":
            elements.append(PageBreak())

        elif btype == "spacer":
            elements.append(Spacer(1, block.get("pt", 10)))

    return elements


# ─── Page Template Callbacks ─────────────────────────────────────────────────

FOOTER_LEFT = "Dibuat oleh Sijil Mutaba'ah"

def _build_page_callbacks(orientation):
    W, H = orientation

    def on_first_page(canvas, doc):
        canvas.saveState()

        render_school_header(doc, canvas, W, H)

        # Footer
        canvas.setFont(FONT, 7)
        canvas.setFillColor(hex_to_color(GRAY_400))
        canvas.drawString(MARGIN, 10 * mm, FOOTER_LEFT)
        canvas.drawCentredString(W / 2, 10 * mm, f"Hal. {doc.page}")
        date_export = getattr(doc, "_pdf_date", "")
        if date_export:
            canvas.drawRightString(W - MARGIN, 10 * mm, date_export)

        canvas.restoreState()

    def on_later_pages(canvas, doc):
        canvas.saveState()

        # Small title bar on subsequent pages
        app_title = getattr(doc, "_pdf_title", "Sijil Mutaba'ah")
        canvas.setFont(FONT_O, 7)
        canvas.setFillColor(hex_to_color(GRAY_400))
        canvas.drawString(MARGIN, H - 10 * mm, app_title)
        canvas.setStrokeColor(hex_to_color(GRAY_200))
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, H - 12 * mm, W - MARGIN, H - 12 * mm)

        # Footer
        canvas.setFont(FONT, 7)
        canvas.setFillColor(hex_to_color(GRAY_400))
        canvas.drawString(MARGIN, 10 * mm, FOOTER_LEFT)
        canvas.drawCentredString(W / 2, 10 * mm, f"Hal. {doc.page}")
        date_export = getattr(doc, "_pdf_date", "")
        if date_export:
            canvas.drawRightString(W - MARGIN, 10 * mm, date_export)

        canvas.restoreState()

    return on_first_page, on_later_pages


# ─── Main Generator ─────────────────────────────────────────────────────────

def generate_pdf(title, subtitle, date, content, out_path,
                 school_logo="", school_foundation="", school_name="",
                 guru_name="", halaqah_name="", periode="",
                 siswa_name="", total_setoran=0, total_ayat=0,
                 total_halaman=0, current_juz="-", last_memorization="-"):
    content_elements = build_body(content)

    TOP_MARGIN = 14 * mm
    BOTTOM_MARGIN = 14 * mm

    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        title=title,
    )

    doc._pdf_title = title
    doc._pdf_subtitle = subtitle
    doc._pdf_date = date
    doc._school_logo = school_logo
    doc._school_foundation = school_foundation
    doc._school_name = school_name
    doc._guru_name = guru_name
    doc._halaqah_name = halaqah_name
    doc._periode = periode
    doc._siswa_name = siswa_name
    doc._total_setoran = total_setoran
    doc._total_ayat = total_ayat
    doc._total_halaman = total_halaman
    doc._current_juz = current_juz
    doc._last_memorization = last_memorization

    has_school = bool(school_logo or school_foundation or school_name)
    GAP = 8 * mm
    HEADER_H = 22 * mm

    elements = []
    elements.append(Spacer(1, HEADER_H if has_school else 4 * mm))

    info = build_student_info(doc)
    if info:
        elements.append(info)
        elements.append(Spacer(1, GAP))

    summary = build_summary_cards(doc)
    if summary:
        elements.append(summary)
        elements.append(Spacer(1, GAP))

    elements += content_elements

    on_first, on_later = _build_page_callbacks(A4)
    doc.build(elements, onFirstPage=on_first, onLaterPages=on_later)


def main():
    parser = argparse.ArgumentParser(description="Generate A4 Portrait PDF report")
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
        meta = {}
    else:
        content = data.get("content", [])
        meta = {
            k: data.get(k, "")
            for k in [
                "title", "subtitle", "date", "schoolLogo",
                "schoolFoundationName", "schoolName",
                "guruName", "halaqahName", "periode",
                "siswaName", "totalSetoran", "totalAyat",
                "totalHalaman", "currentJuz", "lastMemorization",
            ]
        }

    generate_pdf(
        title=meta.get("title", args.title),
        subtitle=meta.get("subtitle", args.subtitle),
        date=meta.get("date", args.date),
        content=content,
        out_path=args.out,
        school_logo=meta.get("schoolLogo", ""),
        school_foundation=meta.get("schoolFoundationName", ""),
        school_name=meta.get("schoolName", ""),
        guru_name=meta.get("guruName", ""),
        halaqah_name=meta.get("halaqahName", ""),
        periode=meta.get("periode", ""),
        siswa_name=meta.get("siswaName", ""),
        total_setoran=meta.get("totalSetoran", 0),
        total_ayat=meta.get("totalAyat", 0),
        total_halaman=meta.get("totalHalaman", 0),
        current_juz=meta.get("currentJuz", "-"),
        last_memorization=meta.get("lastMemorization", "-"),
    )
    print(f"PDF written to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
