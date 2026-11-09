"""
test_comparison.py
------------------
Reproducible test suite for ImageGuard's Image Comparison System.
Covers 5 core scenarios required for IVP project evaluation:
  1. Two identical images
  2. Original image vs image with edited amount/text
  3. Images with small irrelevant pixel differences (noise & compression)
  4. Images with different dimensions
  5. Invalid or corrupted image inputs
"""

import os
import sys
import unittest
import cv2
import numpy as np

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.comparison import compare_images, validate_image, align_or_match_dimensions
from modules.verdict import calculate_comparison_verdict, calculate_verdict
from modules.preprocessing import preprocess_image, resize_for_comparison
from app import app


def create_sample_receipt(text_amount: str = "$1000.00") -> np.ndarray:
    """Helper to generate a clean synthetic receipt/invoice screenshot."""
    img = np.full((400, 600, 3), 255, dtype=np.uint8)
    cv2.rectangle(img, (20, 20), (580, 380), (230, 230, 230), 2)
    cv2.putText(img, "OFFICIAL INVOICE", (50, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (20, 20, 20), 2)
    cv2.line(img, (50, 75), (550, 75), (200, 200, 200), 1)
    cv2.putText(img, f"Invoice Total: {text_amount}", (50, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    cv2.putText(img, "Account No: 9876-5432-10", (50, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (50, 50, 50), 1)
    cv2.putText(img, "Status: VERIFIED & PAID", (50, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 140, 0), 2)
    cv2.putText(img, "Authorized by: Finance Dept", (50, 270), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1)
    return img


class TestImageComparisonSystem(unittest.TestCase):

    def setUp(self):
        self.original = create_sample_receipt("$1000.00")

    def test_1_identical_images(self):
        """Scenario 1: Two identical images must yield 1.0 similarity and no differences."""
        img_identical = self.original.copy()

        ssim_score, diff_heatmap, highlighted, regions, align_info = compare_images(
            self.original, img_identical, return_alignment=True
        )
        confidence, verdict, findings = calculate_comparison_verdict(
            ssim_score=ssim_score,
            suspicious_regions=regions,
            alignment_info=align_info,
        )

        self.assertAlmostEqual(ssim_score, 1.0, places=3)
        self.assertEqual(len(regions), 0)
        self.assertEqual(verdict, "No Significant Differences Detected")
        self.assertEqual(confidence, 0.0)
        self.assertIn("identical", findings[0].lower() + findings[1].lower())

    def test_2_edited_amount_or_text(self):
        """Scenario 2: An edited amount must be highlighted and result in 'Differences Detected'."""
        # Create an intentionally modified version changing $1000.00 -> $9000.00
        tampered = self.original.copy()
        # Erase old amount area
        cv2.rectangle(tampered, (225, 95), (370, 130), (255, 255, 255), -1)
        # Write altered amount
        cv2.putText(tampered, "$9000.00", (225, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

        ssim_score, diff_heatmap, highlighted, regions, align_info = compare_images(
            self.original, tampered, return_alignment=True
        )
        confidence, verdict, findings = calculate_comparison_verdict(
            ssim_score=ssim_score,
            suspicious_regions=regions,
            alignment_info=align_info,
        )

        # Confirm differences detected
        self.assertGreater(len(regions), 0, "Expected at least 1 modified region around the altered text.")
        self.assertEqual(verdict, "Differences Detected")
        self.assertGreaterEqual(confidence, 70.0)

        # Confirm bounding box covers the altered coordinates (x ~ 225, y ~ 95)
        matched_box = False
        for r in regions:
            # Check overlap with the edited bounding region (x: 220..380, y: 90..135)
            if (r['x'] <= 350 and (r['x'] + r['w']) >= 225 and
                r['y'] <= 135 and (r['y'] + r['h']) >= 95):
                matched_box = True
                break
        self.assertTrue(matched_box, f"Expected bounding box around edited amount, got: {regions}")

        # Ensure verdict does NOT contradict detected regions
        self.assertNotEqual(verdict, "No Manipulation Detected")
        self.assertNotEqual(verdict, "No Significant Differences Detected")

    def test_3_small_irrelevant_pixel_differences(self):
        """Scenario 3: Subtle noise or compression must be filtered out without false alarms."""
        # 3a. Subtle random pixel noise (+- 2 intensity)
        noise = np.random.randint(-2, 3, self.original.shape, dtype=int)
        noisy = np.clip(self.original.astype(int) + noise, 0, 255).astype(np.uint8)

        score_noise, _, _, regions_noise = compare_images(self.original, noisy)
        conf_noise, verdict_noise, _ = calculate_comparison_verdict(score_noise, regions_noise)

        self.assertEqual(len(regions_noise), 0, "Tiny noise must be filtered out.")
        self.assertEqual(verdict_noise, "No Significant Differences Detected")
        self.assertLess(conf_noise, 15.0)

        # 3b. JPEG compression artifacts (quality 80)
        _, enc = cv2.imencode('.jpg', self.original, [cv2.IMWRITE_JPEG_QUALITY, 80])
        jpeg_img = cv2.imdecode(enc, cv2.IMREAD_COLOR)

        score_jpeg, _, _, regions_jpeg = compare_images(self.original, jpeg_img)
        conf_jpeg, verdict_jpeg, _ = calculate_comparison_verdict(score_jpeg, regions_jpeg)

        self.assertEqual(len(regions_jpeg), 0, "JPEG compression artifacts should not trigger false tampered regions.")
        self.assertEqual(verdict_jpeg, "No Significant Differences Detected")

    def test_4_different_dimensions(self):
        """Scenario 4: Differing image dimensions must be handled safely without crashing."""
        h, w = self.original.shape[:2]
        # Create a 2x scaled version (1200x800)
        scaled_original = cv2.resize(self.original, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)

        # 4a. Compare identical content with different dimensions
        ssim_score, diff_heatmap, highlighted, regions, align_info = compare_images(
            self.original, scaled_original, return_alignment=True
        )
        conf, verdict, findings = calculate_comparison_verdict(ssim_score, regions, align_info)

        self.assertIsNotNone(diff_heatmap)
        self.assertEqual(highlighted.shape[:2], (h, w))
        self.assertEqual(len(regions), 0)
        self.assertEqual(verdict, "No Significant Differences Detected")

        # 4b. Compare scaled version with an edit
        tampered_scaled = scaled_original.copy()
        cv2.rectangle(tampered_scaled, (450, 190), (740, 260), (255, 255, 255), -1)
        cv2.putText(tampered_scaled, "$9000.00", (450, 240), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (0, 0, 0), 4)

        ssim_t, _, high_t, regions_t, align_t = compare_images(
            self.original, tampered_scaled, return_alignment=True
        )
        conf_t, verdict_t, _ = calculate_comparison_verdict(ssim_t, regions_t, align_t)

        self.assertGreater(len(regions_t), 0, "Edited region in resized image must be detected.")
        self.assertEqual(verdict_t, "Differences Detected")

    def test_5_invalid_or_corrupted_images(self):
        """Scenario 5: Invalid, empty, or corrupted image data must raise informative errors."""
        # 5a. None input
        with self.assertRaises(ValueError):
            validate_image(None, "test_none")

        # 5b. Empty array
        with self.assertRaises(ValueError):
            validate_image(np.array([]), "test_empty")

        # 5c. Image too small (< 7x7)
        with self.assertRaises(ValueError):
            validate_image(np.full((5, 5, 3), 100, dtype=np.uint8), "test_small")

        # 5d. Corrupted bytes passed to preprocess_image
        with self.assertRaises(ValueError):
            preprocess_image(b"not a valid image byte stream")

        # 5e. Empty bytes
        with self.assertRaises(ValueError):
            preprocess_image(b"")

    def test_6_api_endpoint_integration(self):
        """Test Flask /api/compare endpoint end-to-end with multipart form uploads."""
        client = app.test_client()

        # Encode test images to PNG bytes
        _, orig_bytes = cv2.imencode('.png', self.original)

        tampered = self.original.copy()
        cv2.rectangle(tampered, (225, 95), (370, 130), (255, 255, 255), -1)
        cv2.putText(tampered, "$9000.00", (225, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        _, susp_bytes = cv2.imencode('.png', tampered)

        import io

        # 6a. Successful comparison request
        response = client.post(
            '/api/compare',
            data={
                'original': (io.BytesIO(orig_bytes.tobytes()), 'original.png'),
                'suspected': (io.BytesIO(susp_bytes.tobytes()), 'tampered.png'),
            },
            content_type='multipart/form-data',
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['mode'], 'compare')
        self.assertEqual(data['verdict'], 'Differences Detected')
        self.assertGreater(data['suspicious_regions'], 0)
        self.assertIn('diff_heatmap', data)
        self.assertIn('highlighted_image', data)
        self.assertIn('report', data)
        self.assertIn('ssim_score', data)

        # 6b. Missing file field test
        res_missing = client.post('/api/compare', data={'original': (io.BytesIO(orig_bytes.tobytes()), 'orig.png')})
        self.assertEqual(res_missing.status_code, 400)

        # 6c. Corrupted file test
        res_corrupt = client.post(
            '/api/compare',
            data={
                'original': (io.BytesIO(b'corrupted garbage data'), 'bad.png'),
                'suspected': (io.BytesIO(susp_bytes.tobytes()), 'good.png'),
            },
            content_type='multipart/form-data',
        )
        self.assertEqual(res_corrupt.status_code, 400)
        self.assertIn('error', res_corrupt.get_json())


if __name__ == '__main__':
    unittest.main(verbosity=2)
