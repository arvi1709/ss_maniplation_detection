"""
comparison.py
-------------
Compares two images using Structural Similarity Index (SSIM)
and pixel-level difference analysis.

Identifies structural differences, generates a heatmap,
filters out noise/compression artifacts, and places bounding boxes
around meaningful changed regions.
"""

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim


def validate_image(img: np.ndarray, name: str = "image") -> np.ndarray:
    """
    Validate that an input is a valid, non-empty image array.
    Ensures the array has sufficient dimensions for SSIM and standard 3-channel BGR format.

    Args:
        img: Input image array.
        name: Parameter name for descriptive error messages.

    Returns:
        3-channel BGR numpy array.

    Raises:
        ValueError: If the image is None, empty, has invalid dimensions, or too small.
    """
    if img is None or not isinstance(img, np.ndarray):
        raise ValueError(f"Invalid {name}: expected a non-null numpy ndarray.")

    if img.size == 0 or img.ndim < 2:
        raise ValueError(f"Invalid {name}: image data is empty or corrupted.")

    h, w = img.shape[:2]
    if h < 7 or w < 7:
        raise ValueError(
            f"Invalid {name}: dimensions ({w}x{h}) are too small for SSIM comparison (minimum 7x7 required)."
        )

    # Normalize to 3-channel BGR format
    if img.ndim == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    elif img.shape[2] == 3:
        return img.copy()
    else:
        raise ValueError(f"Invalid {name}: unsupported number of channels ({img.shape[2]}).")


def align_or_match_dimensions(img1: np.ndarray, img2: np.ndarray) -> tuple[np.ndarray, np.ndarray, dict]:
    """
    Ensure img1 and img2 have matching spatial dimensions for comparison.
    - If dimensions are already identical: returns unchanged.
    - If aspect ratio is identical/near-identical: uses safe INTER_AREA/INTER_LINEAR interpolation.
    - If aspect ratio differs moderately: attempts lightweight ORB affine alignment.
    - Otherwise: falls back to safe dimension matching.

    Args:
        img1: Reference original image (BGR).
        img2: Suspected image (BGR).

    Returns:
        img1: Reference image.
        img2_matched: Dimension-matched suspected image.
        alignment_info: Dict with details on alignment/scaling performed.
    """
    h1, w1 = img1.shape[:2]
    h2, w2 = img2.shape[:2]

    # Case 1: Exact dimensions match
    if (h1, w1) == (h2, w2):
        return img1, img2.copy(), {
            'status': 'exact_match',
            'aligned': False,
            'aspect_diff': 0.0,
            'description': 'Images share identical dimensions (no scaling required).'
        }

    ar1 = w1 / float(h1)
    ar2 = w2 / float(h2)
    aspect_diff = abs(ar1 - ar2) / max(ar1, ar2)

    # Case 2: Near-identical aspect ratio (e.g. same screenshot at different DPI/resolution)
    # Direct interpolation is mathematically optimal and avoids sub-pixel warping jitter.
    if aspect_diff < 0.02:
        interp = cv2.INTER_AREA if (w2 > w1 or h2 > h1) else cv2.INTER_LINEAR
        resized2 = cv2.resize(img2, (w1, h1), interpolation=interp)
        return img1, resized2, {
            'status': 'resolution_matched',
            'aligned': False,
            'method': 'interpolation',
            'aspect_diff': float(aspect_diff),
            'description': f'Images have matching aspect ratio; scaled suspected image from ({w2}x{h2}) to ({w1}x{h1}).'
        }

    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

    # Case 3: Attempt lightweight ORB affine alignment if aspect ratios are within range
    if aspect_diff < 0.30:
        try:
            orb = cv2.ORB_create(nfeatures=1000)
            kp1, des1 = orb.detectAndCompute(gray1, None)
            kp2, des2 = orb.detectAndCompute(gray2, None)

            if des1 is not None and des2 is not None and len(des1) >= 12 and len(des2) >= 12:
                matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
                matches = sorted(matcher.match(des1, des2), key=lambda x: x.distance)

                if len(matches) >= 10:
                    pts1 = np.float32([kp1[m.queryIdx].pt for m in matches[:50]]).reshape(-1, 1, 2)
                    pts2 = np.float32([kp2[m.trainIdx].pt for m in matches[:50]]).reshape(-1, 1, 2)

                    matrix, inliers = cv2.estimateAffinePartial2D(
                        pts2, pts1, method=cv2.RANSAC, ransacReprojThreshold=4.0
                    )

                    if matrix is not None and inliers is not None and int(np.sum(inliers)) >= 10:
                        scale = np.linalg.norm(matrix[:, 0])
                        if 0.25 <= scale <= 4.0:
                            aligned2 = cv2.warpAffine(
                                img2, matrix, (w1, h1),
                                flags=cv2.INTER_LINEAR,
                                borderMode=cv2.BORDER_REFLECT
                            )
                            return img1, aligned2, {
                                'status': 'aligned',
                                'aligned': True,
                                'method': 'orb_affine',
                                'inliers': int(np.sum(inliers)),
                                'aspect_diff': float(aspect_diff),
                                'description': 'Lightweight affine alignment successfully matched suspected image to reference.'
                            }
        except Exception:
            pass

    # Case 4: Fallback safe resizing
    interp = cv2.INTER_AREA if (w2 > w1 or h2 > h1) else cv2.INTER_LINEAR
    resized2 = cv2.resize(img2, (w1, h1), interpolation=interp)
    return img1, resized2, {
        'status': 'resized',
        'aligned': False,
        'method': 'interpolation',
        'aspect_diff': float(aspect_diff),
        'description': f'Images had differing dimensions ({w1}x{h1} vs {w2}x{h2}); suspected image resized to match.'
    }


def _merge_adjacent_boxes(boxes: list[dict], padding: int = 6) -> list[dict]:
    """
    Merge overlapping or closely adjacent bounding boxes so multi-character
    or multi-part edits (e.g. edited words/numbers) form single coherent regions.
    """
    if not boxes:
        return []

    rects = [
        [b['x'] - padding, b['y'] - padding, b['x'] + b['w'] + padding, b['y'] + b['h'] + padding, b['area']]
        for b in boxes
    ]

    merged: list[dict] = []
    while rects:
        r = rects.pop(0)
        has_overlap = True
        while has_overlap:
            has_overlap = False
            i = 0
            while i < len(rects):
                o = rects[i]
                if not (r[2] < o[0] or r[0] > o[2] or r[3] < o[1] or r[1] > o[3]):
                    r[0] = min(r[0], o[0])
                    r[1] = min(r[1], o[1])
                    r[2] = max(r[2], o[2])
                    r[3] = max(r[3], o[3])
                    r[4] += o[4]
                    rects.pop(i)
                    has_overlap = True
                else:
                    i += 1

        x1 = max(0, r[0] + padding)
        y1 = max(0, r[1] + padding)
        x2 = r[2] - padding
        y2 = r[3] - padding
        merged.append({
            'x': int(x1),
            'y': int(y1),
            'w': int(max(1, x2 - x1)),
            'h': int(max(1, y2 - y1)),
            'area': float(r[4])
        })

    return merged


def compare_images(
    img1: np.ndarray,
    img2: np.ndarray,
    min_contour_area: int = 100,
    diff_threshold: int = 45,
    return_alignment: bool = False,
):
    """
    Compare two images using Structural Similarity Index (SSIM) and pixel difference.

    Steps:
      1. Validate both images and handle differing dimensions / alignment.
      2. Convert images to grayscale.
      3. Compute SSIM score and per-pixel structural difference map.
      4. Combine structural dissimilarity and absolute pixel difference.
      5. Generate a difference heatmap with JET colormap.
      6. Threshold difference to find meaningful changed regions while filtering noise.
      7. Draw red bounding boxes labeled 'Difference' on the suspected image.

    Args:
        img1: Original reference image (BGR numpy array).
        img2: Suspected/edited image (BGR numpy array).
        min_contour_area: Minimum contour area in pixels to filter out noise artifacts.
        diff_threshold: Intensity difference cutoff (0–255) for meaningful changes.
        return_alignment: If True, returns alignment_info dict as 5th element.

    Returns:
        ssim_score:         Float in [-1, 1]. 1.0 = identical.
        diff_heatmap:       BGR heatmap showing pixel/structural differences.
        img2_highlighted:   Suspected image with red bounding boxes on changed areas.
        suspicious_regions: List of dicts with bounding box coordinates and area.
        (optional) alignment_info: Dict with alignment/resizing details.
    """
    # 1. Validation
    valid_img1 = validate_image(img1, name="original_image")
    valid_img2 = validate_image(img2, name="suspected_image")

    # 2. Dimension matching and lightweight alignment
    ref_img, matched_img, align_info = align_or_match_dimensions(valid_img1, valid_img2)
    h_ref, w_ref = ref_img.shape[:2]

    # 3. Grayscale conversion
    gray1 = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(matched_img, cv2.COLOR_BGR2GRAY)

    # 4. SSIM computation
    score, ssim_map = ssim(gray1, gray2, full=True, data_range=255)
    score = float(np.clip(score, -1.0, 1.0))

    # Dissimilarity map:
    ssim_clamped = np.clip(ssim_map, 0.0, 1.0)
    dissim_u8 = (255.0 * (1.0 - ssim_clamped)).astype(np.uint8)

    # Absolute pixel intensity difference
    abs_diff = cv2.absdiff(gray1, gray2)

    # Combined difference: captures both structural degradation and luminance shift
    combined_diff = cv2.addWeighted(dissim_u8, 0.6, abs_diff, 0.4, 0)

    # 5. Difference Heatmap (0 = identical/dark blue, 255 = maximum difference/red)
    diff_heatmap = cv2.applyColorMap(combined_diff, cv2.COLORMAP_JET)

    # 6. Thresholding & Morphological Filtering:
    # A fixed difference threshold (e.g. 45) avoids Otsu's bimodal pitfall on unimodal differences.
    _, thresh = cv2.threshold(combined_diff, diff_threshold, 255, cv2.THRESH_BINARY)

    # Morphological opening (removes isolated 1-2 pixel noise)
    kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel_open)

    # Morphological closing (joins nearby strokes of edited letters or digits)
    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel_close)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    raw_regions = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area >= min_contour_area:
            x, y, w, h = cv2.boundingRect(contour)

            # Ignore boundary edge artifacts (within 4px of frame borders)
            if (x <= 4 or y <= 4 or (x + w) >= (w_ref - 4) or (y + h) >= (h_ref - 4)) and (w <= 6 or h <= 6):
                continue

            # Verify region has substantial peak and average difference
            roi = combined_diff[y:y + h, x:x + w]
            if np.max(roi) >= 60.0 and np.mean(roi) >= 20.0 and min(w, h) >= 6:
                raw_regions.append({
                    'x': int(x),
                    'y': int(y),
                    'w': int(w),
                    'h': int(h),
                    'area': float(area)
                })

    # Merge overlapping or touching boxes
    suspicious_regions = _merge_adjacent_boxes(raw_regions, padding=6)

    # 7. Highlight detected regions
    img2_highlighted = matched_img.copy()
    for region in suspicious_regions:
        x, y, w, h = region['x'], region['y'], region['w'], region['h']
        cv2.rectangle(img2_highlighted, (x, y), (x + w, y + h), (0, 0, 255), 2)
        cv2.putText(
            img2_highlighted,
            'Difference',
            (x, max(y - 6, 12)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (0, 0, 255),
            1,
            cv2.LINE_AA
        )

    if return_alignment:
        return score, diff_heatmap, img2_highlighted, suspicious_regions, align_info

    return score, diff_heatmap, img2_highlighted, suspicious_regions
