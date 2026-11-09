"""
verdict.py
----------
Produces transparent forensic verdicts and confidence assessments
for both single-image analysis and dual-image comparison.

Comparison Mode:
  - 'Differences Detected'
  - 'No Significant Differences Detected'
  - 'Unable to Compare Reliably'

Single-Image Mode (Preserved):
  - Aggregates multi-modal signals (ELA, Noise, OCR)
"""


def calculate_comparison_verdict(
    ssim_score: float,
    suspicious_regions: list[dict] | int,
    alignment_info: dict | None = None,
    is_reliable: bool = True,
) -> tuple[float, str, list[str]]:
    """
    Calculate a transparent decision and findings for two-image comparison.

    Possible verdicts:
      - 'Differences Detected'
      - 'No Significant Differences Detected'
      - 'Unable to Compare Reliably'

    Args:
        ssim_score: Structural Similarity score in [-1.0, 1.0].
        suspicious_regions: List of detected bounding box dicts or region count.
        alignment_info: Optional dictionary containing alignment metadata.
        is_reliable: Flag indicating whether comparison could be conducted reliably.

    Returns:
        confidence: Difference certainty score in [0.0, 100.0].
        verdict: One of the 3 specified decision strings.
        findings: List of clear, objective forensic finding strings.
    """
    num_regions = (
        len(suspicious_regions)
        if isinstance(suspicious_regions, list)
        else int(suspicious_regions)
    )

    align = alignment_info or {}
    aspect_diff = align.get('aspect_diff', 0.0)

    # 1. Condition for 'Unable to Compare Reliably'
    if not is_reliable or align.get('unreliable', False) or aspect_diff > 0.45 or ssim_score < 0.25:
        verdict = 'Unable to Compare Reliably'
        confidence = 0.0
        findings = [
            f'SSIM score {ssim_score:.4f} — structural correspondence is too low for reliable comparison.',
            'Unable to compare reliably due to substantial differences in framing, aspect ratio, or perspective.',
            'Ensure both reference and suspected images share the same viewpoint, alignment, and scale.',
            'Notice: Differences can also result from viewpoint, scaling, or compression changes and do not alone prove forgery.',
        ]
        return confidence, verdict, findings

    # 2. Condition for 'Differences Detected'
    if num_regions > 0 or ssim_score < 0.94:
        verdict = 'Differences Detected'
        # Base confidence of 75% for confirmed localized differences, scaling with regions and SSIM drop
        confidence = min(
            99.0,
            round(75.0 + min(num_regions * 6.0, 18.0) + max(0.0, (1.0 - ssim_score) * 40.0), 1),
        )
        findings = []

        if num_regions > 0:
            findings.append(
                f"{num_regions} significant changed region(s) detected between original and suspected images."
            )
            findings.append(
                f"SSIM similarity score is {ssim_score:.4f} — structural deviation localized in highlighted area(s)."
            )
        else:
            findings.append(
                f"SSIM similarity score is {ssim_score:.4f} — notable structural deviation detected across the image."
            )

        if align.get('method') == 'orb_affine':
            findings.append(
                "Lightweight affine alignment was applied to correct minor spatial displacement."
            )
        elif align.get('method') == 'interpolation':
            findings.append(
                "Images had differing dimensions and were matched using interpolation. Consistent image framing is recommended for highest precision."
            )

        findings.append(
            "Bounding box(es) placed around detected discrepancies on the suspected image."
        )
        findings.append(
            "Disclaimer: Detected differences indicate visual modifications between the two images. However, differences may also arise from compression re-encoding, format conversion, or resizing. Findings should be corroborated with file metadata and context."
        )
        return confidence, verdict, findings

    # 3. Condition for 'No Significant Differences Detected'
    verdict = 'No Significant Differences Detected'
    confidence = max(0.0, round((1.0 - ssim_score) * 100.0, 1))
    identical_str = "images are structurally identical." if ssim_score >= 0.9999 else "high structural correspondence between images."
    findings = [
        f"SSIM similarity score is {ssim_score:.4f} — {identical_str}",
        "No significant localized changed regions detected between original and suspected images.",
    ]

    if ssim_score < 1.0:
        findings.append(
            "Minor pixel-level variations observed are within standard compression, sampling, or noise tolerances."
        )

    findings.append(
        "Notice: While no significant visual modifications were identified, ensure the reference image is from an authentic, verified source."
    )
    return confidence, verdict, findings


def calculate_verdict(
    ssim_score: float | None = None,
    suspicious_regions: int | list = 0,
    ela_intensity: float = 0.0,
    ocr_data: dict | None = None,
    noise_score: float = 0.0,
    mode: str = 'single',
    alignment_info: dict | None = None,
) -> tuple[float, str, list[str]]:
    """
    Calculate confidence score and verdict from forensic analysis signals.
    Supports both single-image mode (heuristic multi-modal) and comparison mode.

    Args:
        ssim_score:         SSIM score from comparison (None for single-image mode).
        suspicious_regions: Count or list of flagged regions.
        ela_intensity:      Mean ELA pixel intensity.
        ocr_data:           Dict from ocr_analysis.extract_text().
        noise_score:        Fraction of outlier noise blocks (0.0–1.0).
        mode:               'single' or 'compare'.
        alignment_info:     Optional alignment metadata for comparison mode.

    Returns:
        confidence: Float in [0, 100].
        verdict:    Verdict string.
        findings:   List of human-readable finding strings.
    """
    if mode == 'compare' or (ssim_score is not None and mode != 'single'):
        return calculate_comparison_verdict(
            ssim_score=ssim_score if ssim_score is not None else 1.0,
            suspicious_regions=suspicious_regions,
            alignment_info=alignment_info,
        )

    # Single-image forensic scoring (Preserved unchanged)
    region_count = (
        len(suspicious_regions)
        if isinstance(suspicious_regions, list)
        else int(suspicious_regions)
    )

    confidence = 0.0
    findings = []

    if region_count > 0:
        region_contribution = min(region_count * 4.0, 20.0)
        confidence += region_contribution
        findings.append(
            f"{region_count} suspicious region(s) detected with significant pixel-level differences."
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
