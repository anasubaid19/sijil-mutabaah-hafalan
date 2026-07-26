#!/usr/bin/env python3
"""
PDF generator using reportlab — inspired by minimax-pdf's design token approach.
Reads content.json, produces a print-ready PDF with cover + body pages.

Usage:
  echo '{"title":"...", "type":"report", "content":[...]}' | python3 scripts/generate-pdf.py --out report.pdf
  python3 scripts/generate-pdf.py --title "My Report" --type report --content content.json --out report.pdf
"""

import json
import sys
import os
import argparse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF

# ─── Design Tokens (minimax-pdf approach) ───────────────────────────────────

PALETTES = {
    "report": {
        "bg": "#FFFFFF",
        "cover_bg": "#0F172A",
        "cover_accent": "#0D9488",
        "cover_text": "#F8FAFC",
        "heading": "#0F172A",
        "body": "#334155",
        "muted": "#64748B",
        "border": "#E2E8F0",
        "table_header_bg": "#0D9488",
        "table_header_fg": "#FFFFFF",
        "table_alt_bg": "#F0FDFA",
        "callout_bg": "#F0FDFA",
        "callout_border": "#0D9488",
        "accent": "#0D9488",
    },
    "academic": {
        "bg": "#FFFFFF",
        "cover_bg": "#1E293B",
        "cover_accent": "#1E40AF",
        "cover_text": "#F8FAFC",
        "heading": "#1E293B",
        "body": "#334155",
        "muted": "#64748B",
        "border": "#E2E8F0",
        "table_header_bg": "#1E40AF",
        "table_header_fg": "#FFFFFF",
        "table_alt_bg": "#EFF6FF",
        "callout_bg": "#EFF6FF",
        "callout_border": "#1E40AF",
        "accent": "#1E40AF",
    },
    "minimal": {
        "bg": "#FFFFFF",
        "cover_bg": "#FAFAF9",
        "cover_accent": "#DC2626",
        "cover_text": "#1C1917",
        "heading": "#1C1917",
        "body": "#44403C",
        "muted": "#78716C",
        "border": "#E7E5E4",
        "table_header_bg": "#DC2626",
        "table_header_fg": "#FFFFFF",
        "table_alt_bg": "#FEF2F2",
        "callout_bg": "#FEF2F2",
        "callout_border": "#DC2626",
        "accent": "#DC2626",
    },
}

FONT_SIZES = {
    "cover_title": 36,
    "cover_subtitle": 16,
    "cover_author": 14,
    "h1": 22,
    "h2": 16,
    "h3": 13,
    "body": 10.5,
    "caption": 9,
    "table_header": 9.5,
    "table_body": 9.5,
    "callout": 10,
}

SPACING = {
    "cover_title_gap": 12,
    "h1_before": 24,
    "h1_after": 12,
    "h2_before": 18,
    "h2_after": 8,
    "h3_before": 12,
    "h3_after": 6,
    "body_after": 8,
    "bullet_after": 4,
    "table_after": 12,
    "callout_after": 12,
    "divider_after": 12,
    "caption": 6,
}


def hex_to_color(hex_str):
    return HexColor(hex_str)


def build_styles(palette):
    styles = getSampleStyleSheet()
    colors = PALETTES.get(palette, PALETTES["report"])

    styles.add(ParagraphStyle(
        "CoverTitle",
        fontSize=FONT_SIZES["cover_title"],
        leading=FONT_SIZES["cover_title"] * 1.2,
        textColor=hex_to_color(colors["cover_text"]),
        alignment=TA_CENTER,
        spaceAfter=SPACING["cover_title_gap"],
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        "CoverSubtitle",
        fontSize=FONT_SIZES["cover_subtitle"],
        leading=FONT_SIZES["cover_subtitle"] * 1.4,
        textColor=hex_to_color(colors["cover_text"]),
        alignment=TA_CENTER,
        fontName="Helvetica",
    ))
    styles.add(ParagraphStyle(
        "CoverAuthor",
        fontSize=FONT_SIZES["cover_author"],
        leading=FONT_SIZES["cover_author"] * 1.4,
        textColor=hex_to_color(colors["cover_text"]),
        alignment=TA_CENTER,
        fontName="Helvetica",
    ))
    styles.add(ParagraphStyle(
        "H1",
        fontSize=FONT_SIZES["h1"],
        leading=FONT_SIZES["h1"] * 1.3,
        textColor=hex_to_color(colors["heading"]),
        fontName="Helvetica-Bold",
        spaceBefore=SPACING["h1_before"],
        spaceAfter=SPACING["h1_after"],
    ))
    styles.add(ParagraphStyle(
        "H2",
        fontSize=FONT_SIZES["h2"],
        leading=FONT_SIZES["h2"] * 1.3,
        textColor=hex_to_color(colors["heading"]),
        fontName="Helvetica-Bold",
        spaceBefore=SPACING["h2_before"],
        spaceAfter=SPACING["h2_after"],
    ))
    styles.add(ParagraphStyle(
        "H3",
        fontSize=FONT_SIZES["h3"],
        leading=FONT_SIZES["h3"] * 1.3,
        textColor=hex_to_color(colors["heading"]),
        fontName="Helvetica-Bold",
        spaceBefore=SPACING["h3_before"],
        spaceAfter=SPACING["h3_after"],
    ))
    styles.add(ParagraphStyle(
        "BT",
        fontSize=FONT_SIZES["body"],
        leading=FONT_SIZES["body"] * 1.6,
        textColor=hex_to_color(colors["body"]),
        fontName="Helvetica",
        alignment=TA_JUSTIFY,
        spaceAfter=SPACING["body_after"],
    ))
    styles.add(ParagraphStyle(
        "BI",
        fontSize=FONT_SIZES["body"],
        leading=FONT_SIZES["body"] * 1.5,
        textColor=hex_to_color(colors["body"]),
        fontName="Helvetica",
        leftIndent=16,
        bulletIndent=4,
        spaceAfter=SPACING["bullet_after"],
    ))
    styles.add(ParagraphStyle(
        "CO",
        fontSize=FONT_SIZES["callout"],
        leading=FONT_SIZES["callout"] * 1.5,
        textColor=hex_to_color(colors["body"]),
        fontName="Helvetica-Oblique",
        leftIndent=12,
        spaceAfter=SPACING["callout_after"],
    ))
    styles.add(ParagraphStyle(
        "CP",
        fontSize=FONT_SIZES["caption"],
        leading=FONT_SIZES["caption"] * 1.4,
        textColor=hex_to_color(colors["muted"]),
        fontName="Helvetica",
        spaceAfter=SPACING["caption"],
    ))
    return styles


def escape_xml(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def format_inline(text):
    """Convert <b>, <i>, <u> tags to reportlab XML equivalents."""
    t = escape_xml(text)
    t = t.replace("&lt;b&gt;", "<b>").replace("&lt;/b&gt;", "</b>")
    t = t.replace("&lt;i&gt;", "<i>").replace("&lt;/i&gt;", "</i>")
    t = t.replace("&lt;u&gt;", "<u>").replace("&lt;/u&gt;", "</u>")
    return t


def build_cover_page(title, subtitle, author, date, palette):
    """Build cover page as a list of flowables."""
    colors = PALETTES.get(palette, PALETTES["report"])
    elements = []

    cover_bg = hex_to_color(colors["cover_bg"])
    accent = hex_to_color(colors["cover_accent"])

    # Cover as a colored table that fills the page
    cover_content = []
    cover_content.append(Spacer(1, 60 * mm))

    # Title
    p_title = Paragraph(
        format_inline(title),
        ParagraphStyle(
            "CT",
            fontSize=FONT_SIZES["cover_title"],
            leading=FONT_SIZES["cover_title"] * 1.2,
            textColor=hex_to_color(colors["cover_text"]),
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
        ),
    )
    cover_content.append(p_title)

    # Accent line
    cover_content.append(Spacer(1, 8))
    cover_content.append(HRFlowable(
        width="30%", thickness=2, color=accent,
        spaceAfter=12, spaceBefore=4,
    ))

    # Subtitle
    if subtitle:
        p_sub = Paragraph(
            format_inline(subtitle),
            ParagraphStyle(
                "CS",
                fontSize=FONT_SIZES["cover_subtitle"],
                leading=FONT_SIZES["cover_subtitle"] * 1.4,
                textColor=hex_to_color(colors["cover_text"]),
                alignment=TA_CENTER,
                fontName="Helvetica",
            ),
        )
        cover_content.append(p_sub)
        cover_content.append(Spacer(1, 24))

    # Author + date
    meta_parts = []
    if author:
        meta_parts.append(author)
    if date:
        meta_parts.append(date)
    if meta_parts:
        p_meta = Paragraph(
            " &middot; ".join(escape_xml(m) for m in meta_parts),
            ParagraphStyle(
                "CM",
                fontSize=FONT_SIZES["cover_author"],
                leading=FONT_SIZES["cover_author"] * 1.4,
                textColor=hex_to_color(colors["cover_text"]),
                alignment=TA_CENTER,
                fontName="Helvetica",
            ),
        )
        cover_content.append(p_meta)

    # Wrap in a full-page colored background table
    # A4 = 297mm, margins = 20+25 = 45mm, available = 252mm
    cover_table = Table(
        [[cover_content]],
        colWidths=[170 * mm],
        rowHeights=[245 * mm],
    )
    cover_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), cover_bg),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("ROUNDEDCORNERS", [0, 0, 0, 0]),
    ]))

    elements.append(cover_table)
    elements.append(PageBreak())
    return elements


def build_table(headers, rows, palette):
    """Build a styled table."""
    colors = PALETTES.get(palette, PALETTES["report"])
    header_bg = hex_to_color(colors["table_header_bg"])
    header_fg = hex_to_color(colors["table_header_fg"])
    alt_bg = hex_to_color(colors["table_alt_bg"])
    border_color = hex_to_color(colors["border"])

    # Format cells
    header_row = [Paragraph(
        format_inline(h),
        ParagraphStyle(
            "TH",
            fontSize=FONT_SIZES["table_header"],
            leading=FONT_SIZES["table_header"] * 1.3,
            textColor=header_fg,
            fontName="Helvetica-Bold",
        ),
    ) for h in headers]

    body_rows = []
    for row in rows:
        body_rows.append([Paragraph(
            format_inline(str(cell)),
            ParagraphStyle(
                "TD",
                fontSize=FONT_SIZES["table_body"],
                leading=FONT_SIZES["table_body"] * 1.4,
                textColor=hex_to_color(colors["body"]),
                fontName="Helvetica",
            ),
        ) for cell in row])

    data = [header_row] + body_rows

    # Auto-width: distribute evenly
    n_cols = len(headers)
    available = 165 * mm
    col_width = available / n_cols
    col_widths = [col_width] * n_cols

    table = Table(data, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), header_fg),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), FONT_SIZES["table_header"]),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
    ]

    # Alternating row backgrounds
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), alt_bg))

    table.setStyle(TableStyle(style_cmds))
    return table


def build_callout(text, palette):
    """Build a callout box."""
    colors = PALETTES.get(palette, PALETTES["report"])
    bg = hex_to_color(colors["callout_bg"])
    border = hex_to_color(colors["callout_border"])

    p = Paragraph(
        format_inline(text),
        ParagraphStyle(
            "CO",
            fontSize=FONT_SIZES["callout"],
            leading=FONT_SIZES["callout"] * 1.5,
            textColor=hex_to_color(colors["body"]),
            fontName="Helvetica-Oblique",
        ),
    )

    t = Table([[p]], colWidths=[160 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LINEBEFOREDECOR", (0, 0), (0, -1), 3, border),
    ]))
    return t


def build_body(content, styles, palette):
    """Convert content.json blocks to reportlab flowables."""
    elements = []
    numbered_counter = 0

    for block in content:
        btype = block.get("type", "body")
        text = block.get("text", "")

        if btype == "h1":
            numbered_counter = 0
            elements.append(Paragraph(format_inline(text), styles["H1"]))
        elif btype == "h2":
            numbered_counter = 0
            elements.append(Paragraph(format_inline(text), styles["H2"]))
        elif btype == "h3":
            numbered_counter = 0
            elements.append(Paragraph(format_inline(text), styles["H3"]))
        elif btype == "body":
            elements.append(Paragraph(format_inline(text), styles["BT"]))
        elif btype == "bullet":
            elements.append(Paragraph(
                f"&bull;  {format_inline(text)}",
                styles["BI"],
            ))
        elif btype == "numbered":
            numbered_counter += 1
            elements.append(Paragraph(
                f"{numbered_counter}.  {format_inline(text)}",
                styles["BI"],
            ))
        elif btype == "callout":
            elements.append(Spacer(1, 4))
            elements.append(build_callout(text, palette))
            elements.append(Spacer(1, 4))
        elif btype == "table":
            headers = block.get("headers", [])
            rows = block.get("rows", [])
            if headers and rows:
                elements.append(Spacer(1, 4))
                elements.append(build_table(headers, rows, palette))
                elements.append(Spacer(1, SPACING["table_after"]))
        elif btype == "divider":
            elements.append(Spacer(1, 4))
            elements.append(HRFlowable(
                width="100%", thickness=0.5,
                color=hex_to_color(PALETTES.get(palette, PALETTES["report"])["border"]),
                spaceAfter=SPACING["divider_after"],
            ))
        elif btype == "spacer":
            pt = block.get("pt", 12)
            elements.append(Spacer(1, pt))
        elif btype == "pagebreak":
            elements.append(PageBreak())
        elif btype == "caption":
            elements.append(Paragraph(format_inline(text), styles["CP"]))

    return elements


def add_page_number(canvas, doc):
    """Footer with page number."""
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(HexColor("#94A3B8"))
    page_num = canvas.getPageNumber()
    if page_num > 1:  # Skip cover page
        text = f"Halaman {page_num - 1}"
        canvas.drawCentredString(A4[0] / 2, 15 * mm, text)
    canvas.restoreState()


def generate_pdf(title, subtitle, author, date, content, palette, out_path):
    """Main entry: build and write PDF."""
    styles = build_styles(palette)
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=25 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    elements = []
    elements.extend(build_cover_page(title, subtitle, author, date, palette))
    elements.extend(build_body(content, styles, palette))

    doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)


def main():
    parser = argparse.ArgumentParser(description="Generate PDF from content JSON")
    parser.add_argument("--title", default="Document")
    parser.add_argument("--subtitle", default="")
    parser.add_argument("--author", default="")
    parser.add_argument("--date", default="")
    parser.add_argument("--type", default="report", choices=list(PALETTES.keys()))
    parser.add_argument("--content", default=None, help="Path to content.json (or stdin)")
    parser.add_argument("--out", default="output.pdf")
    args = parser.parse_args()

    if args.content:
        with open(args.content) as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    # Support both {title, content, ...} and raw content array
    if isinstance(data, list):
        content = data
    else:
        content = data.get("content", [])
        args.title = data.get("title", args.title)
        args.subtitle = data.get("subtitle", args.subtitle)
        args.author = data.get("author", args.author)
        args.date = data.get("date", args.date)
        args.type = data.get("type", args.type)

    generate_pdf(
        title=args.title,
        subtitle=args.subtitle,
        author=args.author,
        date=args.date,
        content=content,
        palette=args.type,
        out_path=args.out,
    )
    print(f"PDF written to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
