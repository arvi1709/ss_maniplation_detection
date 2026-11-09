"""
test_video_analysis.py
----------------------
Reproducible test suite for ImageGuard's Video Temporal Analysis module.
Covers core scenarios required for IVP project evaluation:
  1. Valid short MP4 video
  2. Video containing identical frames (static scene) -> 'No Significant Sampled-Frame Changes'
  3. Video with a visible scene change (abrupt cut) -> 'Visual Transition Detected — Review Recommended'
  4. Invalid or corrupted video file
  5. Unsupported file format (.mkv / .txt)
  6. Video exceeding duration limit (> 60s)
  7. Correct frame timestamps and sampling interval
  8. Flask API endpoint integration (POST /api/video/analyze)
  9. Video with a moderate visual transition (acknowledged in summary with timestamp range)
  10. Strict neutrality check (no claims of 'natural motion' or 'definitive forgery')
"""

import io
import os
import sys
import tempfile
import unittest
import cv2
import numpy as np

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.video_analysis import (
    validate_video_file,
    extract_sampled_frames,
    analyze_frame_transitions,
    summarize_video_analysis,
    process_video_file,
    MAX_DURATION_SECONDS,
)
from app import app


def _create_synthetic_video(
    duration_sec: float = 3.0,
    fps: float = 10.0,
    width: int = 160,
    height: int = 120,
    pattern: str = "static",
    suffix: str = ".mp4",
) -> str:
    """Helper to programmatically generate small synthetic MP4/AVI videos."""
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    path = tmp.name
    tmp.close()

    total_frames = int(round(duration_sec * fps))
    fourcc = cv2.VideoWriter_fourcc(*'mp4v') if suffix == '.mp4' else cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(path, fourcc, fps, (width, height))

    try:
        for i in range(total_frames):
            frame = np.full((height, width, 3), 240, dtype=np.uint8)

            if pattern == "static":
                cv2.circle(frame, (width // 2, height // 2), 25, (0, 0, 200), -1)
                cv2.putText(frame, "Static", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)

            elif pattern == "scene_cut":
                # First half: red circle on light background
                if i < total_frames // 2:
                    cv2.circle(frame, (width // 2, height // 2), 25, (0, 0, 200), -1)
                    cv2.putText(frame, "Scene 1", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
                else:
                    # Second half: dark blue background with yellow rectangle
                    frame = np.full((height, width, 3), 40, dtype=np.uint8)
                    cv2.rectangle(frame, (30, 30), (width - 30, height - 30), (0, 220, 255), -1)
                    cv2.putText(frame, "Scene 2", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            elif pattern == "moderate_change":
                # First half: plain receipt card
                # Second half: receipt card with an altered dark badge (moderate SSIM ~ 0.85-0.90)
                cv2.rectangle(frame, (20, 20), (width - 20, height - 20), (220, 220, 220), 1)
                cv2.putText(frame, "Paytm Receipt", (25, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)
                if i < total_frames // 2:
                    cv2.putText(frame, "Rs 1,000", (30, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
                    cv2.rectangle(frame, (30, 85), (100, 105), (180, 180, 180), -1)
                else:
                    cv2.putText(frame, "Rs 2,000", (30, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
                    cv2.rectangle(frame, (30, 85), (130, 105), (30, 30, 30), -1)

            elif pattern == "motion":
                # Moving circle across the screen
                x = int((i / max(1, total_frames - 1)) * (width - 40)) + 20
                cv2.circle(frame, (x, height // 2), 15, (0, 180, 0), -1)

            out.write(frame)

        out.release()
        return path

    except Exception:
        out.release()
        if os.path.exists(path):
            os.unlink(path)
        raise


class TestVideoAnalysisModule(unittest.TestCase):

    def test_1_valid_short_mp4(self):
        """Scenario 1: Validate metadata and extraction on a standard short MP4 video."""
        path = _create_synthetic_video(duration_sec=2.0, fps=10.0, pattern="static")
        try:
            meta = validate_video_file(path, "short_test.mp4")
            self.assertEqual(meta['filename'], "short_test.mp4")
            self.assertEqual(meta['duration'], 2.0)
            self.assertEqual(meta['fps'], 10.0)
            self.assertEqual(meta['total_frames'], 20)
            self.assertEqual(meta['width'], 160)
            self.assertEqual(meta['height'], 120)

            raw_frames, frame_info = extract_sampled_frames(
                path, fps=meta['fps'], total_frames=meta['total_frames'], sample_interval_sec=1.0
            )
            self.assertGreaterEqual(len(raw_frames), 2)
            self.assertEqual(len(raw_frames), len(frame_info))
            self.assertIn('preview', frame_info[0])
            self.assertGreater(len(frame_info[0]['preview']), 100)
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_2_video_containing_identical_frames(self):
        """Scenario 2: A static video must produce Low Visual Change and 'No Significant Sampled-Frame Changes'."""
        path = _create_synthetic_video(duration_sec=3.0, fps=10.0, pattern="static")
        try:
            with open(path, 'rb') as f:
                video_bytes = f.read()

            result = process_video_file(video_bytes, "static.mp4", sample_interval_sec=1.0)
            self.assertEqual(result['mode'], 'video')

            transitions = result['transitions']
            self.assertGreaterEqual(len(transitions), 2)

            for t in transitions:
                self.assertAlmostEqual(t['ssim_score'], 1.0, places=2)
                self.assertEqual(t['change_level'], 'Low Visual Change')
                self.assertEqual(t['level_code'], 'low')

            summary = result['summary']
            self.assertEqual(summary['high_change_count'], 0)
            self.assertEqual(summary['moderate_change_count'], 0)
            self.assertEqual(summary['status_level'], 'low')
            self.assertEqual(summary['overall_status'], "No Significant Sampled-Frame Changes")
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_3_video_with_visible_scene_change(self):
        """Scenario 3: An abrupt scene cut must yield 'Visual Transition Detected — Review Recommended'."""
        path = _create_synthetic_video(duration_sec=3.0, fps=10.0, pattern="scene_cut")
        try:
            with open(path, 'rb') as f:
                video_bytes = f.read()

            result = process_video_file(video_bytes, "scene_cut.mp4", sample_interval_sec=1.0)
            transitions = result['transitions']
            summary = result['summary']

            # Must contain at least one high visual change transition
            has_high_change = any(t['level_code'] == 'high' for t in transitions)
            self.assertTrue(has_high_change, "Expected at least 1 transition flagged as 'high' change.")
            self.assertGreaterEqual(summary['high_change_count'], 1)
            self.assertEqual(summary['status_level'], 'high')
            self.assertEqual(summary['overall_status'], "Visual Transition Detected — Review Recommended")

            # Verify that the most significant transition timestamp range is included
            self.assertIsNotNone(summary['most_significant_transition'])
            self.assertIn("range_str", summary['most_significant_transition'])
            self.assertTrue(any("Most significant transition detected at" in obs for obs in summary['observations']))

            high_trans = [t for t in transitions if t['level_code'] == 'high'][0]
            self.assertLess(high_trans['ssim_score'], 0.80)
            self.assertIn("diff_heatmap", high_trans)
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_4_invalid_or_corrupted_video(self):
        """Scenario 4: Corrupted, empty, or non-video data must raise clean ValueErrors."""
        with self.assertRaises(ValueError):
            validate_video_file("non_existent_file.mp4", "non_existent_file.mp4")

        tmp = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
        tmp_path = tmp.name
        tmp.close()
        try:
            with self.assertRaises(ValueError):
                validate_video_file(tmp_path, "empty.mp4")
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

        tmp2 = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
        tmp2.write(b"NOT A REAL VIDEO DATA STREAM AT ALL")
        tmp2.flush()
        tmp2_path = tmp2.name
        tmp2.close()
        try:
            with self.assertRaises(ValueError):
                validate_video_file(tmp2_path, "corrupted.mp4")
        finally:
            if os.path.exists(tmp2_path):
                os.unlink(tmp2_path)

    def test_5_unsupported_file_format(self):
        """Scenario 5: Unsupported formats (.mkv, .mov, .txt) must be rejected."""
        tmp = tempfile.NamedTemporaryFile(suffix='.mkv', delete=False)
        tmp.write(b"mock mkv data")
        tmp.close()
        try:
            with self.assertRaises(ValueError) as ctx:
                validate_video_file(tmp.name, "unsupported.mkv")
            self.assertIn("Unsupported video format", str(ctx.exception))
        finally:
            if os.path.exists(tmp.name):
                os.unlink(tmp.name)

    def test_6_video_exceeding_duration_limit(self):
        """Scenario 6: Videos exceeding 60.0s duration limit must be rejected."""
        path = _create_synthetic_video(duration_sec=MAX_DURATION_SECONDS + 5.0, fps=10.0, pattern="static")
        try:
            with self.assertRaises(ValueError) as ctx:
                validate_video_file(path, "too_long.mp4", max_duration_sec=MAX_DURATION_SECONDS)
            self.assertIn("exceeds the maximum limit", str(ctx.exception))
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_7_frame_timestamps_and_sampling(self):
        """Scenario 7: Sampled frames must be spaced accurately according to interval."""
        path = _create_synthetic_video(duration_sec=4.0, fps=10.0, pattern="motion")
        try:
            meta = validate_video_file(path, "motion.mp4")
            raw_frames, frame_info = extract_sampled_frames(
                path, fps=meta['fps'], total_frames=meta['total_frames'], sample_interval_sec=1.0
            )
            self.assertEqual(len(frame_info), 4)
            for i, info in enumerate(frame_info):
                expected_time = round(i * 1.0, 2)
                self.assertAlmostEqual(info['timestamp_sec'], expected_time, delta=0.2)
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_8_api_endpoint_integration(self):
        """Scenario 8: Test Flask POST /api/video/analyze end-to-end."""
        client = app.test_client()

        path = _create_synthetic_video(duration_sec=2.0, fps=10.0, pattern="static")
        try:
            with open(path, 'rb') as f:
                video_bytes = f.read()

            res = client.post(
                '/api/video/analyze',
                data={'video': (io.BytesIO(video_bytes), 'test_api.mp4')},
                content_type='multipart/form-data',
            )

            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data['mode'], 'video')
            self.assertIn('metadata', data)
            self.assertIn('sampled_frames', data)
            self.assertIn('transitions', data)
            self.assertIn('summary', data)
            self.assertEqual(data['metadata']['duration'], 2.0)
            self.assertGreaterEqual(len(data['sampled_frames']), 2)

        finally:
            if os.path.exists(path):
                os.unlink(path)

        res_missing = client.post('/api/video/analyze', data={})
        self.assertEqual(res_missing.status_code, 400)
        self.assertIn('error', res_missing.get_json())

        res_corrupt = client.post(
            '/api/video/analyze',
            data={'video': (io.BytesIO(b'corrupted byte stream'), 'bad.mp4')},
            content_type='multipart/form-data',
        )
        self.assertEqual(res_corrupt.status_code, 400)
        self.assertIn('error', res_corrupt.get_json())

    def test_9_video_with_moderate_transition(self):
        """Scenario 9: Videos containing moderate transitions must acknowledge them in summary."""
        path = _create_synthetic_video(duration_sec=4.0, fps=10.0, pattern="moderate_change")
        try:
            with open(path, 'rb') as f:
                video_bytes = f.read()

            result = process_video_file(video_bytes, "moderate.mp4", sample_interval_sec=1.0)
            summary = result['summary']

            # Overall status must be 'Visual Transition Detected — Review Recommended'
            self.assertEqual(summary['overall_status'], "Visual Transition Detected — Review Recommended")
            self.assertGreaterEqual(summary['moderate_change_count'] + summary['high_change_count'], 1)

            # Check that most_significant_transition contains timestamp range
            self.assertIsNotNone(summary['most_significant_transition'])
            range_str = summary['most_significant_transition']['range_str']
            self.assertTrue("s → " in range_str or "s" in range_str)
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_10_strict_neutrality_verification(self):
        """Scenario 10: Verify summary text never claims definitive natural motion or definitive forgery."""
        patterns = ["static", "scene_cut", "moderate_change"]
        forbidden_claims = [
            "natural motion observed",
            "consistent with natural subject movement",
            "video is forged",
            "deepfake detected",
            "guaranteed tampering",
            "definitely forgery",
        ]

        for p in patterns:
            path = _create_synthetic_video(duration_sec=3.0, fps=10.0, pattern=p)
            try:
                with open(path, 'rb') as f:
                    res = process_video_file(f.read(), f"{p}.mp4")

                summary = res['summary']
                all_text = " ".join([
                    summary['overall_status'].lower(),
                    " ".join(summary['observations']).lower(),
                    summary['disclaimer'].lower(),
                ] + [t['explanation'].lower() for t in res['transitions']])

                for claim in forbidden_claims:
                    self.assertNotIn(claim, all_text, f"Forbidden biased phrase '{claim}' found in {p} video results.")

                # Assert that overall_status is in allowed set
                allowed_statuses = {
                    "No Significant Sampled-Frame Changes",
                    "Visual Transition Detected — Review Recommended",
                }
                self.assertIn(summary['overall_status'], allowed_statuses)
            finally:
                if os.path.exists(path):
                    os.unlink(path)


if __name__ == '__main__':
    unittest.main(verbosity=2)
