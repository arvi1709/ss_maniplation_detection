"""
edge_detection.py
-----------------
Uses the Canny edge detector to identify sharp, unnatural boundaries
within an image. Copy-paste manipulation often introduces hard edges
at the boundary of the inserted region that are inconsistent with the
surrounding content's natural edge profile.
"""

import cv2
import numpy as np


def detect_edges(img: np.ndarray):
    """
    Apply Gaussian blur followed by Canny edge detection.
    Counts the number of significant edge contours as a proxy for
    how many distinct edge clusters exist (higher counts in unusual places
    may indicate artificial insertion boundaries).

    Args:
        img: BGR numpy array.

    Returns:
        edges:           Binary edge map (grayscale numpy array).
        significant_count: Number of contours with area > 50 pixels.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    edges = cv2.Canny(blurred, threshold1=50, threshold2=150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    significant_count = sum(1 for c in contours if cv2.contourArea(c) > 50)

    return edges, significant_count
