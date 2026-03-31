"""
PDF Controller
Generates a clean medical-style health report PDF for a given user.
"""

from io import BytesIO
from datetime import datetime
from bson import ObjectId
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from app.config.database import Database
from app.controllers.biomarker_controller import get_current_readings, get_biomarker_history, get_alerts


# ---------------------------------------------------------------------------
# Colour palette
# ---------------------------------------------------------------------------
NAVY = colors.HexColor("#1e3a5f")
SLATE = colors.HexColor("#334155")
HEADER_BG = colors.HexColor("#e2e8f0")
WHITE = colors.white
LIGHT_BORDER = colors.HexColor("#cbd5e1")

PAGE_W, PAGE_H = A4

# ---------------------------------------------------------------------------
# Reusable style helpers
# ---------------------------------------------------------------------------

def _build_styles():
    """Return a dict of named ParagraphStyles."""
    base = getSampleStyleSheet()

    title = ParagraphStyle(
        "ReportTitle",
        fontName="Helvetica-Bold",
        fontSize=20,
        textColor=NAVY,
        alignment=1,           # centre
        spaceAfter=2 * mm,
    )
    subtitle = ParagraphStyle(
        "ReportSubtitle",
        fontName="Helvetica",
        fontSize=9,
        textColor=SLATE,
        alignment=1,
        spaceAfter=6 * mm,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=NAVY,
        spaceBefore=8 * mm,
        spaceAfter=3 * mm,
        borderPad=(0, 0, 2, 0),
    )
    body = ParagraphStyle(
        "ReportBody",
        fontName="Helvetica",
        fontSize=9,
        textColor=SLATE,
        spaceAfter=2 * mm,
    )
    footer = ParagraphStyle(
        "ReportFooter",
        fontName="Helvetica-Oblique",
        fontSize=8,
        textColor=colors.HexColor("#94a3b8"),
        alignment=1,
        spaceBefore=10 * mm,
    )
    return {
        "title": title,
        "subtitle": subtitle,
        "section_heading": section_heading,
        "body": body,
        "footer": footer,
    }


def _base_table_style(has_header: bool = True) -> TableStyle:
    """Return a TableStyle for a tidy medical-look table."""
    cmds = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), SLATE),
        ("GRID", (0, 0), (-1, -1), 0.4, LIGHT_BORDER),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, colors.HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    if has_header:
        cmds += [
            ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, 0), (-1, 0), NAVY),
        ]
    return TableStyle(cmds)


# ---------------------------------------------------------------------------
# Small utilities
# ---------------------------------------------------------------------------

def _safe(value, fallback="N/A"):
    """Return value if truthy, else fallback string."""
    if value is None or (isinstance(value, str) and value.strip() == ""):
        return fallback
    return str(value)


def _calc_bmi(height_cm, weight_kg):
    """Return BMI string or N/A."""
    try:
        h = float(height_cm)
        w = float(weight_kg)
        if h > 0 and w > 0:
            bmi = w / ((h / 100) ** 2)
            return f"{bmi:.1f}"
    except (TypeError, ValueError):
        pass
    return "N/A"


def _calc_age(dob_str):
    """Return age integer from a date-of-birth string (YYYY-MM-DD) or None."""
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d")
        today = datetime.utcnow()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except Exception:
        return None


def _fmt_dt(dt):
    """Format a datetime object for display."""
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d %H:%M UTC")
    return str(dt) if dt else "N/A"


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def _build_header(styles, generated_at: str):
    elems = []
    elems.append(Paragraph("HEALIX — Health Report", styles["title"]))
    elems.append(Paragraph(f"Generated: {generated_at}", styles["subtitle"]))

    # Horizontal rule (thin coloured table)
    rule = Table([[""]], colWidths=[PAGE_W - 40 * mm])
    rule.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 1.5, NAVY),
        ("LINEBELOW", (0, 0), (-1, 0), 0.4, LIGHT_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    elems.append(rule)
    elems.append(Spacer(1, 4 * mm))
    return elems


def _build_demographics(user: dict, styles) -> list:
    elems = []
    elems.append(Paragraph("Patient Demographics", styles["section_heading"]))

    dob = _safe(user.get("date_of_birth"))
    age = user.get("age")
    if age is None and dob != "N/A":
        age = _calc_age(dob)
    age_str = str(age) if age is not None else "N/A"

    height = user.get("height")
    weight = user.get("weight")
    bmi = _calc_bmi(height, weight)

    rows = [
        ["Field", "Value", "Field", "Value"],
        ["Full Name",
         f"{_safe(user.get('first_name'))} {_safe(user.get('last_name'))}",
         "Date of Birth", dob],
        ["Age", age_str, "Gender", _safe(user.get("gender"))],
        ["Blood Type", _safe(user.get("blood_type")),
         "Occupation", _safe(user.get("occupation"))],
        ["Height", f"{_safe(height)} cm", "Weight", f"{_safe(weight)} kg"],
        ["BMI", bmi, "Phone", _safe(user.get("phone_number"))],
        ["Insurance", _safe(user.get("medical_insurance")), "", ""],
    ]

    ec_name = _safe(user.get("emergency_contact_name"))
    ec_phone = _safe(user.get("emergency_contact_phone"))
    ec_rel = _safe(user.get("emergency_contact_relationship"))
    rows.append(["Emergency Contact",
                 f"{ec_name} ({ec_rel})",
                 "Emergency Phone", ec_phone])

    col_w = (PAGE_W - 40 * mm) / 4
    tbl = Table(rows, colWidths=[col_w] * 4)
    tbl.setStyle(_base_table_style(has_header=True))
    elems.append(tbl)
    return elems


def _build_medical_history(user: dict, styles) -> list:
    elems = []
    elems.append(Paragraph("Medical History", styles["section_heading"]))

    rows = [
        ["Category", "Details"],
        ["Health Conditions", _safe(user.get("health_conditions"))],
        ["Allergies", _safe(user.get("allergies"))],
        ["Family History", _safe(user.get("family_history"))],
    ]

    col_w = PAGE_W - 40 * mm
    tbl = Table(rows, colWidths=[col_w * 0.28, col_w * 0.72])
    tbl.setStyle(_base_table_style(has_header=True))
    elems.append(tbl)
    return elems


def _build_med_supp_table(items: list, label: str, styles) -> list:
    """Render a Medications or Supplements table; returns [] if no items."""
    if not items:
        return []
    elems = []
    elems.append(Paragraph(label, styles["section_heading"]))

    rows = [["Name", "Dosage", "Frequency"]]
    for item in items:
        rows.append([
            _safe(item.get("name")),
            _safe(item.get("dosage")),
            _safe(item.get("frequency")),
        ])

    col_w = (PAGE_W - 40 * mm) / 3
    tbl = Table(rows, colWidths=[col_w] * 3)
    tbl.setStyle(_base_table_style(has_header=True))
    elems.append(tbl)
    return elems


def _build_lifestyle(user: dict, styles) -> list:
    elems = []
    elems.append(Paragraph("Lifestyle", styles["section_heading"]))

    rows = [
        ["Factor", "Value"],
        ["Smoking Status", _safe(user.get("smoking_status"))],
        ["Alcohol Frequency", _safe(user.get("alcohol_frequency"))],
        ["Exercise Frequency", _safe(user.get("exercise_frequency"))],
        ["Sleep Habit", _safe(user.get("sleep_habit"))],
        ["Dietary Preference", _safe(user.get("dietary_preference"))],
    ]

    col_w = PAGE_W - 40 * mm
    tbl = Table(rows, colWidths=[col_w * 0.35, col_w * 0.65])
    tbl.setStyle(_base_table_style(has_header=True))
    elems.append(tbl)
    return elems


# ---------------------------------------------------------------------------
# Page 2 helpers
# ---------------------------------------------------------------------------

def _status_for_field(field: str, value) -> str:
    """Return 'Normal' or 'Warning' based on alert thresholds."""
    from app.controllers.biomarker_controller import ALERTS
    try:
        v = float(value)
    except (TypeError, ValueError):
        return "N/A"

    thresholds = ALERTS.get(field)
    if not thresholds:
        return "Normal"

    if "low" in thresholds and v < thresholds["low"]:
        return "Warning"
    if "high" in thresholds and v > thresholds["high"]:
        return "Warning"
    return "Normal"


def _build_current_readings(readings: dict, styles) -> list:
    elems = []
    elems.append(Paragraph("Current Biomarker Readings", styles["section_heading"]))

    field_labels = {
        "heart_rate": "Heart Rate (bpm)",
        "spo2": "Blood Oxygen / SpO2 (%)",
        "steps": "Steps",
        "calories": "Calories (kcal)",
        "sleep_hours": "Sleep (hours)",
        "systolic_bp": "Systolic BP (mmHg)",
        "diastolic_bp": "Diastolic BP (mmHg)",
    }

    rows = [["Metric", "Value", "Recorded At", "Status"]]
    for field, label in field_labels.items():
        entry = readings.get(field)
        if entry:
            val = entry.get("value", "N/A")
            rec_at = _fmt_dt(entry.get("recorded_at"))
            status = _status_for_field(field, val)
        else:
            val, rec_at, status = "No data", "—", "—"
        rows.append([label, str(val), rec_at, status])

    col_w = PAGE_W - 40 * mm
    tbl = Table(rows, colWidths=[col_w * 0.32, col_w * 0.12, col_w * 0.36, col_w * 0.20])

    style = _base_table_style(has_header=True)
    # Colour Warning cells red, Normal cells green
    for row_idx, row in enumerate(rows[1:], start=1):
        status_val = row[3]
        if status_val == "Warning":
            style.add("TEXTCOLOR", (3, row_idx), (3, row_idx), colors.HexColor("#dc2626"))
            style.add("FONTNAME", (3, row_idx), (3, row_idx), "Helvetica-Bold")
        elif status_val == "Normal":
            style.add("TEXTCOLOR", (3, row_idx), (3, row_idx), colors.HexColor("#16a34a"))

    tbl.setStyle(style)
    elems.append(tbl)
    return elems


def _build_alerts(alert_docs: list, styles) -> list:
    elems = []
    elems.append(Paragraph("Active Alerts", styles["section_heading"]))

    if not alert_docs:
        elems.append(Paragraph("No active alerts on record.", styles["body"]))
        return elems

    # Show up to 10 most recent
    shown = alert_docs[:10]
    rows = [["Timestamp", "Alert Message(s)"]]
    for doc in shown:
        ts = _fmt_dt(doc.get("recorded_at"))
        msgs = "; ".join(doc.get("alerts", [])) or "N/A"
        rows.append([ts, msgs])

    col_w = PAGE_W - 40 * mm
    tbl = Table(rows, colWidths=[col_w * 0.30, col_w * 0.70])
    style = _base_table_style(has_header=True)
    # Highlight alert message column
    style.add("TEXTCOLOR", (1, 1), (1, -1), colors.HexColor("#dc2626"))
    tbl.setStyle(style)
    elems.append(tbl)
    return elems


def _build_footer(styles, generated_at: str) -> list:
    return [
        Spacer(1, 8 * mm),
        Paragraph(
            f"Generated by Healix Health Monitoring System &nbsp;|&nbsp; {generated_at}",
            styles["footer"],
        ),
    ]


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def generate_health_report(user_id: str) -> StreamingResponse:
    """
    Build a two-page PDF health report for `user_id` and return it as a
    StreamingResponse so FastAPI streams the bytes to the client.
    """
    db = Database.get_db()

    # ---- Fetch data --------------------------------------------------------
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")

    readings_resp = await get_current_readings(user_id)
    readings = readings_resp.get("current_readings", {})

    history_resp = await get_biomarker_history(user_id, page=1, limit=30)

    alerts_resp = await get_alerts(user_id)
    alert_docs = alerts_resp.get("alerts", [])

    # ---- Build PDF ---------------------------------------------------------
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Healix Health Report",
        author="Healix Health Monitoring System",
    )

    styles = _build_styles()
    generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    elements = []

    # --- Page 1: Patient Summary ---
    elements += _build_header(styles, generated_at)
    elements += _build_demographics(user, styles)
    elements += _build_medical_history(user, styles)
    elements += _build_med_supp_table(user.get("medications") or [], "Medications", styles)
    elements += _build_med_supp_table(user.get("supplements") or [], "Supplements", styles)
    elements += _build_lifestyle(user, styles)

    # Force page break before biomarker data
    from reportlab.platypus import PageBreak
    elements.append(PageBreak())

    # --- Page 2: Biomarker Data ---
    elements += _build_header(styles, generated_at)
    elements += _build_current_readings(readings, styles)
    elements += _build_alerts(alert_docs, styles)
    elements += _build_footer(styles, generated_at)

    # ---- Compile -----------------------------------------------------------
    doc.build(elements)
    buffer.seek(0)

    filename = f"healix_report_{user_id}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
