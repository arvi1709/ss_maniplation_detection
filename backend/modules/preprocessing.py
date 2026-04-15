"""
preprocessing.py
----------------
Handles image loading and basic preprocessing for forensic analysis.
Converts raw bytes into OpenCV-compatible numpy arrays.
"""

import cv2
import numpy as np


def preprocess_image(image_bytes: bytes):
    """
    Load image from raw bytes and return BGR, RGB, and grayscale versions.

    Returns:
        img     - Original BGR image (OpenCV native format)
        img_rgb - RGB version for display/PIL operations
        gray    - Grayscale version for analysis
    """
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image. Ensure the file is a valid PNG/JPG.")

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    return img, img_rgb, gray


def resize_for_comparison(img1: np.ndarray, img2: np.ndarray):
    """
    Resize two images to the same dimensions for pixel-level comparison.
    Uses the smaller of the two image dimensions to avoid upscaling artifacts.
    """
    h1, w1 = img1.shape[:2]
    h2, w2 = img2.shape[:2]

    h = min(h1, h2)
    w = min(w1, w2)

    img1_resized = cv2.resize(img1, (w, h), interpolation=cv2.INTER_AREA)
    img2_resized = cv2.resize(img2, (w, h), interpolation=cv2.INTER_AREA)

    return img1_resized, img2_resized
