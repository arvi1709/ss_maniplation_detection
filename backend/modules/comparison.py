"""
comparison.py
-------------
Compares two images using Structural Similarity Index (SSIM)
and pixel-level difference analysis. Tampered regions show up
as areas of high difference between the original and suspected image.
"""

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim


def compare_images(img1: np.ndarray, img2: np.ndarray):
    """
    Compare two BGR images of the same size using SSIM and pixel difference.

    Steps:
      1. Convert both images to grayscale.
      2. Compute SSIM score and the per-pixel difference map.
      3. Apply a colormap to the difference for visual clarity (heatmap).
      4. Threshold the difference to find significantly changed regions.
      5. Draw bounding boxes around those regions on the suspected image.

    Args:
        img1: Original image (BGR numpy array).
        img2: Suspected/edited image (BGR numpy array, same size as img1).

    Returns:
        ssim_score:         Float in [0, 1]. Lower = more structural difference.
        diff_heatmap:       BGR heatmap of pixel differences.
        img2_highlighted:   Copy of img2 with red bounding boxes on suspicious areas.
        suspicious_regions: List of dicts with bounding box coordinates and area.
    """
    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

    score, diff = ssim(gray1, gray2, full=True)
    diff = (diff * 255).astype(np.uint8)

    diff_heatmap = cv2.applyColorMap(255 - diff, cv2.COLORMAP_JET)

    _, thresh = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    suspicious_regions = []
    img2_highlighted = img2.copy()

    for contour in contours:
        area = cv2.contourArea(contour)
        if area > 150:
            x, y, w, h = cv2.boundingRect(contour)
            suspicious_regions.append({'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h), 'area': float(area)})
            cv2.rectangle(img2_highlighted, (x, y), (x + w, y + h), (0, 0, 255), 2)
            cv2.putText(img2_highlighted, 'Tampered', (x, y - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

    return float(score), diff_heatmap, img2_highlighted, suspicious_regions
