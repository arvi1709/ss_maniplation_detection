"""
noise_analysis.py
-----------------
Analyzes image noise patterns across blocks. Authentic images typically
have uniform noise distribution, while copy-pasted or digitally inserted
regions exhibit abnormal noise variance — revealing their artificial origin.
"""

import cv2
import numpy as np


def detect_noise_inconsistency(img: np.ndarray, block_size: int = 32):
    """
    Divide the image into uniform blocks and measure variance in each block.
    Blocks whose variance deviates significantly from the image-wide mean
    are flagged as suspicious (they may have been inserted from another image).

    Args:
        img:        BGR numpy array.
        block_size: Size of blocks to analyze (default 32x32 pixels).

    Returns:
        inconsistency_score: Fraction of outlier blocks (0.0 – 1.0).
        suspicious_blocks:   List of block indices that are outliers.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)

    h, w = gray.shape
    variances = []

    for y in range(0, h - block_size, block_size):
        for x in range(0, w - block_size, block_size):
            block = gray[y:y + block_size, x:x + block_size]
            variances.append(float(np.var(block)))

    if len(variances) < 4:
        return 0.0, []

    mean_var = np.mean(variances)
    std_var = np.std(variances)

    threshold = 2.5 * std_var
    suspicious_blocks = [i for i, v in enumerate(variances) if abs(v - mean_var) > threshold]

    inconsistency_score = len(suspicious_blocks) / len(variances)

    return float(inconsistency_score), suspicious_blocks
