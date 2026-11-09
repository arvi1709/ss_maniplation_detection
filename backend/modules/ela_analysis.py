"""
ela_analysis.py
---------------
Error Level Analysis (ELA) - a forensic technique that detects JPEG
compression inconsistencies. Edited regions typically re-compress
at a different rate than the surrounding unmodified content, appearing
as bright/highlighted areas in the ELA output.
"""

import io
import numpy as np
from PIL import Image


def perform_ela(image_bytes: bytes, quality: int = 90):
    """
    Perform Error Level Analysis on the given image bytes.

    Steps:
      1. Load the original image as a PIL Image.
      2. Re-save it as JPEG at a fixed quality level (90 by default).
      3. Compute the absolute difference between original and re-saved.
      4. Scale the difference for visual clarity.

    A higher ELA intensity suggests the image contains regions that
    were saved at a different quality level — a hallmark of copy-paste
    manipulation or digital editing.

    Args:
        image_bytes: Raw bytes of the uploaded image.
        quality:     JPEG re-compression quality (default 90).

    Returns:
        ela_image:    RGB numpy array of the ELA output (scaled).
        ela_intensity: Mean intensity of the ELA image (higher = more suspicious).
    """
    pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    buffer = io.BytesIO()
    pil_img.save(buffer, format='JPEG', quality=quality)
    buffer.seek(0)

    compressed_img = Image.open(buffer).convert('RGB')

    original_array = np.array(pil_img, dtype=np.float32)
    compressed_array = np.array(compressed_img, dtype=np.float32)

    ela = np.abs(original_array - compressed_array)

    ela_scaled = (ela * 10).clip(0, 255).astype(np.uint8)

    ela_intensity = float(np.mean(ela_scaled))

    return ela_scaled, ela_intensity
