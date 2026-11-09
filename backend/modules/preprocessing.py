"""
preprocessing.py
----------------
Handles image loading and basic preprocessing for forensic analysis.
Converts raw bytes into OpenCV-compatible numpy arrays with safe error checking.
"""

import cv2
import numpy as np


def preprocess_image(image_bytes: bytes):
    """
    Load image from raw bytes and return BGR, RGB, and grayscale versions.

    Args:
        image_bytes: Raw bytes from uploaded file.

    Returns:
        img     - Original BGR image (OpenCV native format)
        img_rgb - RGB version for display/PIL operations
        gray    - Grayscale version for analysis

    Raises:
        ValueError: If image_bytes is empty or cannot be decoded as an image.
    """
    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Empty image file provided. Please upload a valid image.")

    img_array = np.frombuffer(image_bytes, np.uint8)
    if img_array.size == 0:
        raise ValueError("Invalid image file buffer.")

    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Ensure the file is a valid PNG/JPG.")

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    return img, img_rgb, gray


def resize_for_comparison(img1: np.ndarray, img2: np.ndarray):
    """
    Safely resize two images to matching dimensions for pixel-level comparison.
    Uses the smaller dimensions to prevent upscaling artifacts.

    Args:
        img1: Reference BGR image.
        img2: Suspected BGR image.

    Returns:
        img1_resized, img2_resized: Both images with identical (w, h).

    Raises:
        ValueError: If either input is None or not a valid image array.
    """
    if img1 is None or img2 is None:
        raise ValueError("Both images must be non-null for comparison resizing.")

    if not isinstance(img1, np.ndarray) or not isinstance(img2, np.ndarray):
        raise ValueError("Image inputs must be numpy ndarrays.")

    if img1.size == 0 or img2.size == 0:
        raise ValueError("Image arrays cannot be empty.")

    h1, w1 = img1.shape[:2]
    h2, w2 = img2.shape[:2]

    if (h1, w1) == (h2, w2):
        return img1.copy(), img2.copy()

    h = min(h1, h2)
    w = min(w1, w2)

    img1_resized = cv2.resize(img1, (w, h), interpolation=cv2.INTER_AREA)
    img2_resized = cv2.resize(img2, (w, h), interpolation=cv2.INTER_AREA)

    return img1_resized, img2_resized
