"""
verdict.py
----------
Aggregates signals from all detection modules to produce a final
manipulation confidence score (0–100%) and a human-readable verdict.

Scoring weights:
  - SSIM deviation:         up to 40 points  (comparison mode only)
  - Suspicious regions:     up to 20 points
  - ELA intensity:          up to 25 points
  - Noise inconsistency:    up to 15 points
  - OCR anomalies:          up to 10 points (5 per anomaly, capped)
"""


def calculate_verdict(
    ssim_score: float | None = None,
    suspicious_regions: int = 0,
    ela_intensity: float = 0.0,
    ocr_data: dict | None = None,
    noise_score: float = 0.0,
) -> tuple[float, str, list[str]]:
    """
    Calculate a confidence score and verdict from multi-modal analysis signals.

    Args:
        ssim_score:         SSIM score from comparison (None for single-image mode).
        suspicious_regions: Count of flagged regions from comparison/ELA.
        ela_intensity:      Mean ELA pixel intensity.
        ocr_data:           Dict from ocr_analysis.extract_text().
        noise_score:        Fraction of outlier noise blocks (0.0–1.0).

    Returns:
        confidence: Float in [0, 100].
        verdict:    'Possible Manipulation Detected' or 'No Manipulation Detected'.
        findings:   List of human-readable finding strings.
    """
    confidence = 0.0
    findings = []

    if ssim_score is not None:
        ssim_contribution = (1.0 - ssim_score) * 40.0
        confidence += ssim_contribution
        if ssim_score < 0.85:
            findings.append(
                f"SSIM score {ssim_score:.4f} — major structural differences found between images."
            )
        elif ssim_score < 0.95:
            findings.append(
                f"SSIM score {ssim_score:.4f} — moderate structural differences detected."
            )
        elif ssim_score < 0.99:
            findings.append(
                f"SSIM score {ssim_score:.4f} — minor structural differences noted."
            )

    if suspicious_regions > 0:
        region_contribution = min(suspicious_regions * 4.0, 20.0)
        confidence += region_contribution
        findings.append(
            f"{suspicious_regions} suspicious region(s) detected with significant pixel-level differences."
        )

    if ela_intensity > 8.0:
        ela_contribution = min(ela_intensity * 0.6, 25.0)
        confidence += ela_contribution
        severity = "high" if ela_intensity > 15 else "moderate"
        findings.append(
            f"ELA intensity {ela_intensity:.2f} — {severity} compression anomaly suggesting digital editing."
        )

    if noise_score > 0.08:
        noise_contribution = min(noise_score * 20.0, 15.0)
        confidence += noise_contribution
        findings.append(
            f"Noise inconsistency score {noise_score:.2%} — {int(noise_score * 100)}% of image blocks show abnormal variance."
        )

    if ocr_data:
        anomalies = ocr_data.get('text_anomalies', [])
        if anomalies:
            ocr_contribution = min(len(anomalies) * 5.0, 10.0)
            confidence += ocr_contribution
            for a in anomalies[:2]:
                findings.append(f"OCR anomaly: {a}")

    confidence = min(round(confidence, 2), 100.0)
    verdict = "Possible Manipulation Detected" if confidence >= 30.0 else "No Manipulation Detected"

    return confidence, verdict, findings
