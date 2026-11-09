"""
ocr_analysis.py
---------------
Uses Tesseract OCR to extract text from images.
Searches extracted text for currency amounts, transaction IDs,
and other numeric patterns that are commonly altered in fake payment
screenshots (e.g., ₹500 changed to ₹5000).

Tesseract OCR is optional in production environments. If the executable is
unavailable or fails to run, this module falls back gracefully without crashing.
"""

import os
import re
import shutil
import cv2
import numpy as np

PYTESSERACT_AVAILABLE = False
try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    pass


def _resolve_tesseract_cmd() -> str | None:
    """
    Locate a valid tesseract binary if available.
    Checks:
      1. TESSERACT_CMD environment variable.
      2. System PATH (via shutil.which).
      3. Standard Windows installation directories.
    """
    if not PYTESSERACT_AVAILABLE:
        return None

    env_cmd = os.environ.get('TESSERACT_CMD')
    if env_cmd and os.path.exists(env_cmd):
        return env_cmd

    which_cmd = shutil.which('tesseract')
    if which_cmd:
        return which_cmd

    # Standard Windows install locations
    windows_candidates = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        os.path.expanduser(r'~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'),
    ]
    for candidate in windows_candidates:
        if os.path.isfile(candidate):
            return candidate

    return None


def is_ocr_available() -> bool:
    """Check if Tesseract library and executable are available on the host system."""
    if not PYTESSERACT_AVAILABLE:
        return False
    cmd = _resolve_tesseract_cmd()
    if cmd:
        pytesseract.pytesseract.tesseract_cmd = cmd
        return True
    return False


# Initialize TESSERACT_AVAILABLE for backwards-compatibility
TESSERACT_AVAILABLE = is_ocr_available()


def extract_text(img: np.ndarray) -> dict:
    """
    Extract text from a BGR image using Tesseract OCR.
    If Tesseract is not available or encounters an execution error, returns
    a safe fallback dictionary without crashing.

    Steps:
      1. Convert to grayscale and apply Otsu's thresholding for better accuracy.
      2. Run pytesseract on the preprocessed image.
      3. Parse out numeric values, currency amounts, and potential anomalies.

    Args:
        img: BGR numpy array.

    Returns:
        dict with keys:
          - full_text:        Complete OCR output string.
          - numbers_found:    List of all numeric strings found.
          - currency_amounts: List of currency-formatted values (₹, $, €, £).
          - text_anomalies:   List of detected suspicious patterns.
    """
    if not is_ocr_available():
        return {
            'full_text': '[Tesseract OCR unavailable on this server (optional analysis skipped)]',
            'numbers_found': [],
            'currency_amounts': [],
            'text_anomalies': ['Tesseract OCR executable not detected'],
        }

    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        config = '--oem 3 --psm 6'
        text = pytesseract.image_to_string(thresh, config=config)

        numbers = re.findall(r'[\d,]+\.?\d*', text)
        numbers = [n for n in numbers if len(n) >= 2]

        currency_amounts = re.findall(r'[₹\$€£]\s*[\d,]+\.?\d*', text)
        anomalies = _detect_text_anomalies(text, numbers, currency_amounts)

        return {
            'full_text': text,
            'numbers_found': numbers[:50],
            'currency_amounts': currency_amounts,
            'text_anomalies': anomalies,
        }
    except Exception as exc:
        # Prevent any unexpected OCR engine failure from failing the entire request
        return {
            'full_text': '',
            'numbers_found': [],
            'currency_amounts': [],
            'text_anomalies': [f'OCR processing error: {str(exc)}'],
        }


def _detect_text_anomalies(text: str, numbers: list, currency_amounts: list) -> list:
    """
    Heuristically detect anomalies in the extracted text.
    Looks for patterns that commonly appear in tampered payment receipts.
    """
    anomalies = []

    for num in numbers:
        digits_only = num.replace(',', '')
        if digits_only.isdigit() and len(digits_only) > 7:
            anomalies.append(f"Unusually long numeric string detected: {num}")

    lines = [line.strip() for line in text.split('\n') if line.strip()]
    for line in lines:
        amounts = re.findall(r'[\d,]+', line)
        if len(amounts) >= 2:
            values = []
            for a in amounts:
                try:
                    values.append(int(a.replace(',', '')))
                except ValueError:
                    pass
            if len(values) >= 2 and max(values) > 10 * min(values) and min(values) > 0:
                anomalies.append(f"Large numeric discrepancy in line: '{line[:60]}'")

    return anomalies[:5]
