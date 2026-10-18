"""
PDF Screening Report Generator for CardioLens
Builds clean, hospital-grade PDF reports using ReportLab.
"""

import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_pdf_report(analysis_data: dict) -> io.BytesIO:
    """
    Creates a clean medical screening report PDF from inference result data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    story = []
    styles = getSampleStyleSheet()

    # Color Palette matching Hospital Glassmorphism
    primary_coral = colors.HexColor("#E85B3F")
    dark_slate = colors.HexColor("#1E293B")
    muted_slate = colors.HexColor("#64748B")
    light_bg = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")
    success_green = colors.HexColor("#16A34A")
    alert_amber = colors.HexColor("#D97706")

    # Custom typography styles
    title_style = ParagraphStyle(
        "CardioLensTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_coral,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        "CardioLensSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=muted_slate
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=dark_slate,
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=dark_slate
    )
    bold_style = ParagraphStyle(
        "BoldText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=dark_slate
    )
    disclaimer_style = ParagraphStyle(
        "DisclaimerText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=muted_slate
    )

    # 1. Header with CardioLens Branding
    header_data = [
        [
            Paragraph("<b>CARDIOLENS</b><br/><font size=8 color='#64748B'>AI Heart Murmur Screening Platform</font>", title_style),
            Paragraph(
                f"<b>Screening ID:</b> {analysis_data.get('analysis_id', 'CL-0000')}<br/>"
                f"<b>Generated:</b> {datetime.now(timezone.utc).strftime('%d %b %Y, %H:%M UTC')}<br/>"
                f"<b>Status:</b> Completed",
                body_style
            )
        ]
    ]
    header_table = Table(header_data, colWidths=[330, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_coral, spaceAfter=14))

    # 2. Screening Result Banner
    prediction = analysis_data.get("prediction", {})
    label = prediction.get("label", "Normal")
    conf_pct = prediction.get("confidence_percentage", 0.0)
    is_murmur = (label == "Murmur Present")

    result_color = alert_amber if is_murmur else success_green
    result_bg = colors.HexColor("#FEF3C7") if is_murmur else colors.HexColor("#DCFCE7")

    result_card_data = [
        [
            Paragraph(f"<font color='{result_color.hexval()}'><b>AI CLASSIFICATION RESULT: {label.upper()}</b></font>", section_heading),
            Paragraph(f"<b>Model Confidence:</b> {conf_pct:.1f}%", bold_style)
        ],
        [
            Paragraph(prediction.get("clinical_summary", "Evaluation complete."), body_style),
            Paragraph(f"<b>Murmur Prob:</b> {prediction.get('probabilities', {}).get('murmur_present', 0)*100:.1f}%", body_style)
        ]
    ]
    result_table = Table(result_card_data, colWidths=[380, 150])
    result_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), result_bg),
        ('BOX', (0,0), (-1,-1), 1, result_color),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(result_table)
    story.append(Spacer(1, 14))

    # 3. Acoustic Recording Information
    story.append(Paragraph("Acoustic Recording Specifications", section_heading))
    audio_info = analysis_data.get("audio", {})
    
    spec_data = [
        [Paragraph("<b>File Analyzed:</b>", bold_style), Paragraph(str(audio_info.get("filename", "audio.wav")), body_style),
         Paragraph("<b>Sampling Rate:</b>", bold_style), Paragraph(f"{audio_info.get('sample_rate_hz', 2000)} Hz", body_style)],
        [Paragraph("<b>Original Duration:</b>", bold_style), Paragraph(f"{audio_info.get('original_duration_seconds', 0.0)} s", body_style),
         Paragraph("<b>Analysis Window:</b>", bold_style), Paragraph(f"{audio_info.get('processed_duration_seconds', 5.0)} s (10,000 samples)", body_style)],
        [Paragraph("<b>RMS Energy:</b>", bold_style), Paragraph(str(audio_info.get("rms_energy", "N/A")), body_style),
         Paragraph("<b>Peak Amplitude:</b>", bold_style), Paragraph(str(audio_info.get("peak_amplitude", "N/A")), body_style)]
    ]
    spec_table = Table(spec_data, colWidths=[110, 155, 110, 155])
    spec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(spec_table)
    story.append(Spacer(1, 14))

    # 4. Neural Network Processing Architecture
    story.append(Paragraph("AI Model Inference Details", section_heading))
    model_info = analysis_data.get("model", {})
    model_data = [
        [Paragraph("<b>Model Name:</b>", bold_style), Paragraph(str(model_info.get("name", "CardioLens CNN")), body_style)],
        [Paragraph("<b>Architecture:</b>", bold_style), Paragraph(str(model_info.get("architecture", "3-Stage 2D CNN with Global Pooling")), body_style)],
        [Paragraph("<b>Feature Representation:</b>", bold_style), Paragraph("Log-Mel Spectrogram (128 Mel bands, fmax=1000Hz, min-max normalized)", body_style)],
        [Paragraph("<b>Probability Distribution:</b>", bold_style), Paragraph(
            f"Normal: {prediction.get('probabilities', {}).get('normal', 0)*100:.1f}%  |  "
            f"Murmur Present: {prediction.get('probabilities', {}).get('murmur_present', 0)*100:.1f}%", body_style
        )],
        [Paragraph("<b>Inference Latency:</b>", bold_style), Paragraph(f"{analysis_data.get('processing_time_ms', 0)} ms on {model_info.get('device', 'cpu').upper()}", body_style)]
    ]
    model_table = Table(model_data, colWidths=[140, 390])
    model_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(model_table)
    story.append(Spacer(1, 14))

    # 5. Clinical Recommendation
    story.append(Paragraph("Clinical Guidance", section_heading))
    guidance_text = prediction.get(
        "clinical_recommendation",
        "Consult a certified physician for physical cardiac auscultation."
    )
    story.append(Paragraph(guidance_text, body_style))
    story.append(Spacer(1, 14))

    # 6. Formal Medical Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.8, color=border_color, spaceAfter=8))
    disclaimer_text = (
        "<b>CLINICAL RESPONSIBILITY DISCLAIMER:</b> CardioLens is an artificial intelligence screening "
        "and educational tool. It does not provide medical diagnoses, treatment instructions, or certified clinical evaluations. "
        "Audio phonocardiograms are subject to noise artifacts, chest placement variation, and clinical heterogeneity. "
        "A negative (Normal) result does not rule out underlying cardiovascular pathologies. "
        "Any suspected symptoms or abnormal findings require prompt diagnostic evaluation by a licensed healthcare professional."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
