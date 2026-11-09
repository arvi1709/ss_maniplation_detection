"""
video_analysis.py
-----------------
Introductory video processing and temporal difference analysis module
for the Image and Video Processing (IVP) project.

Capabilities:
  1. Validates MP4 and AVI video files (size <= 100MB, duration <= 60s).
  2. Extracts representative sampled frames at configurable intervals (default: 1.0s).
  3. Computes frame-to-frame structural differences using SSIM and pixel disparity.
  4. Generates difference heatmaps between consecutive sampled frames.
  5. Categorizes transitions with neutral, objective academic terminology
     ('Low Visual Change', 'Moderate Visual Change', 'High Visual Change').
  6. Synthesizes overall video sequence assessments:
     - 'No Significant Sampled-Frame Changes'
     - 'Visual Transition Detected — Review Recommended'
"""

import base64
import os
import tempfile
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim

# Configuration constants
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB
MAX_DURATION_SECONDS = 60.0              # 60 seconds
MAX_EXTRACTED_FRAMES = 60                 # Up to 60 sampled frames
MAX_FRAME_WIDTH = 3840                    # 4K upper bound
MAX_FRAME_HEIGHT = 2160
SUPPORTED_EXTENSIONS = {'.mp4', '.avi'}


def _to_base64_jpeg(img_bgr: np.ndarray, quality: int = 85) -> str:
    """Encode a BGR numpy array as a base64 JPEG string for lightweight preview."""
    params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    success, buffer = cv2.imencode('.jpg', img_bgr, params)
    if not success:
        _, buffer = cv2.imencode('.png', img_bgr)
    return base64.b64encode(buffer).decode('utf-8')


def validate_video_file(
    file_path: str,
    filename: str,
    max_file_size_bytes: int = MAX_FILE_SIZE_BYTES,
    max_duration_sec: float = MAX_DURATION_SECONDS,
) -> dict:
    """
    Validate that an uploaded file is a readable, supported video meeting duration
    and size constraints.

    Args:
        file_path: Absolute path to the video file on disk.
        filename: Original uploaded filename.
        max_file_size_bytes: Maximum allowed file size in bytes.
        max_duration_sec: Maximum permitted video duration in seconds.

    Returns:
        metadata: Dict with duration, fps, total_frames, width, height, file_size_mb.

    Raises:
        ValueError: If video is invalid, unreadable, unsupported, or exceeds limits.
    """
    if not os.path.isfile(file_path):
        raise ValueError("Video file not found or could not be saved.")

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        raise ValueError("Uploaded video file is empty (0 bytes).")

    if file_size > max_file_size_bytes:
        limit_mb = max_file_size_bytes // (1024 * 1024)
        actual_mb = file_size / (1024 * 1024)
        raise ValueError(
            f"Video file size ({actual_mb:.1f} MB) exceeds maximum allowed limit of {limit_mb} MB."
        )

    _, ext = os.path.splitext(filename.lower())
    if ext not in SUPPORTED_EXTENSIONS:
        supported_str = ", ".join(SUPPORTED_EXTENSIONS)
        raise ValueError(
            f"Unsupported video format '{ext}'. Supported formats: {supported_str}."
        )

    cap = cv2.VideoCapture(file_path)
    try:
        if not cap.isOpened():
            raise ValueError(
                "Unable to open video stream. The file may be corrupt or encoded in an unsupported codec."
            )

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Basic stream sanity checks
        if fps <= 0 or np.isnan(fps):
            raise ValueError("Invalid video stream: frame rate (FPS) could not be determined.")

        if total_frames <= 0:
            raise ValueError("Video contains no readable frames.")

        duration = total_frames / fps
        if duration > max_duration_sec:
            raise ValueError(
                f"Video duration ({duration:.1f}s) exceeds the maximum limit of {int(max_duration_sec)}s."
            )

        if width < 16 or height < 16:
            raise ValueError(f"Video resolution ({width}x{height}) is too small for analysis.")

        if width > MAX_FRAME_WIDTH or height > MAX_FRAME_HEIGHT:
            raise ValueError(
                f"Video resolution ({width}x{height}) exceeds maximum supported resolution ({MAX_FRAME_WIDTH}x{MAX_FRAME_HEIGHT})."
            )

        # Confirm at least the initial frame decodes successfully
        ret, first_frame = cap.read()
        if not ret or first_frame is None or first_frame.size == 0:
            raise ValueError("Could not decode video frames; file appears corrupted.")

        return {
            'filename': filename,
            'duration': round(duration, 2),
            'fps': round(fps, 2),
            'total_frames': total_frames,
            'width': width,
            'height': height,
            'file_size_mb': round(file_size / (1024 * 1024), 2),
        }

    finally:
        cap.release()


def extract_sampled_frames(
    file_path: str,
    fps: float,
    total_frames: int,
    sample_interval_sec: float = 1.0,
    max_frames: int = MAX_EXTRACTED_FRAMES,
) -> tuple[list[np.ndarray], list[dict]]:
    """
    Extract representative frames at a regular time interval.

    Args:
        file_path: Path to the video file.
        fps: Video frame rate.
        total_frames: Total number of frames in the video.
        sample_interval_sec: Interval in seconds between extracted frames.
        max_frames: Maximum number of frames to return.

    Returns:
        raw_frames_bgr: List of BGR numpy arrays.
        frame_metadata: List of dicts with frame_index, timestamp_sec, preview (base64), width, height.
    """
    cap = cv2.VideoCapture(file_path)
    raw_frames: list[np.ndarray] = []
    frame_info: list[dict] = []

    try:
        step_frames = max(1, int(round(fps * sample_interval_sec)))

        current_frame_idx = 0
        while current_frame_idx < total_frames and len(raw_frames) < max_frames:
            cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame_idx)
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            timestamp = round(current_frame_idx / fps, 2)
            h, w = frame.shape[:2]

            raw_frames.append(frame)
            frame_info.append({
                'frame_index': current_frame_idx,
                'timestamp_sec': timestamp,
                'width': w,
                'height': h,
                'preview': _to_base64_jpeg(frame, quality=80),
            })

            current_frame_idx += step_frames

        # If only 1 frame was sampled (very short video), attempt to sample the final frame as well
        if len(raw_frames) == 1 and total_frames > 1:
            last_idx = total_frames - 1
            cap.set(cv2.CAP_PROP_POS_FRAMES, last_idx)
            ret, frame = cap.read()
            if ret and frame is not None:
                h, w = frame.shape[:2]
                raw_frames.append(frame)
                frame_info.append({
                    'frame_index': last_idx,
                    'timestamp_sec': round(last_idx / fps, 2),
                    'width': w,
                    'height': h,
                    'preview': _to_base64_jpeg(frame, quality=80),
                })

        return raw_frames, frame_info

    finally:
        cap.release()


def analyze_frame_transitions(
    frames_bgr: list[np.ndarray],
    frame_info: list[dict],
) -> list[dict]:
    """
    Compute frame-to-frame SSIM and pixel-level differences between consecutive sampled frames.
    Uses neutral, evidence-based descriptions without assuming causes (such as natural motion).

    Args:
        frames_bgr: List of BGR numpy arrays representing sampled frames.
        frame_info: List of frame metadata dicts.

    Returns:
        transitions: List of dicts describing the temporal change between consecutive frames.
    """
    transitions: list[dict] = []
    if len(frames_bgr) < 2:
        return transitions

    for i in range(len(frames_bgr) - 1):
        frame1 = frames_bgr[i]
        frame2 = frames_bgr[i + 1]

        # Convert to grayscale for structural similarity
        gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)

        # If dimensions differ between frames, resize to match
        if gray1.shape != gray2.shape:
            h1, w1 = gray1.shape
            gray2 = cv2.resize(gray2, (w1, h1), interpolation=cv2.INTER_AREA)

        # 1. Structural Similarity Index (SSIM)
        score, ssim_map = ssim(gray1, gray2, full=True, data_range=255)
        ssim_score = float(np.clip(score, -1.0, 1.0))

        # 2. Pixel-level absolute difference
        abs_diff = cv2.absdiff(gray1, gray2)
        mean_abs_diff = float(np.mean(abs_diff))

        # 3. Difference heatmap
        ssim_clamped = np.clip(ssim_map, 0.0, 1.0)
        dissim_u8 = (255.0 * (1.0 - ssim_clamped)).astype(np.uint8)
        combined_diff = cv2.addWeighted(dissim_u8, 0.6, abs_diff, 0.4, 0)
        heatmap_bgr = cv2.applyColorMap(combined_diff, cv2.COLORMAP_JET)

        # 4. Neutral, evidence-based classification:
        if ssim_score >= 0.94 and mean_abs_diff < 12.0:
            change_level = "Low Visual Change"
            level_code = "low"
            badge_color = "green"
            explanation = "High visual similarity between consecutive sampled frames (minimal structural or pixel disparity)."
        elif ssim_score >= 0.80 or mean_abs_diff < 35.0:
            change_level = "Moderate Visual Change"
            level_code = "medium"
            badge_color = "amber"
            explanation = "Moderate visual disparity detected between sampled frames. Review transition heatmap to inspect localized or global changes."
        else:
            change_level = "High Visual Change"
            level_code = "high"
            badge_color = "red"
            explanation = "Substantial visual disparity detected between sampled frames (pronounced structural difference or scene change)."

        transitions.append({
            'transition_index': i,
            'from_frame': frame_info[i]['frame_index'],
            'to_frame': frame_info[i + 1]['frame_index'],
            'from_timestamp': frame_info[i]['timestamp_sec'],
            'to_timestamp': frame_info[i + 1]['timestamp_sec'],
            'ssim_score': round(ssim_score, 4),
            'mean_pixel_diff': round(mean_abs_diff, 2),
            'change_level': change_level,
            'level_code': level_code,
            'badge_color': badge_color,
            'explanation': explanation,
            'diff_heatmap': _to_base64_jpeg(heatmap_bgr, quality=75),
        })

    return transitions


def summarize_video_analysis(
    metadata: dict,
    transitions: list[dict],
) -> dict:
    """
    Generate an overall summary of temporal changes across the video sequence.
    Acyanowledges moderate/high transitions and displays the most significant transition timestamp range.
    """
    if not transitions:
        return {
            'overall_status': 'No Significant Sampled-Frame Changes',
            'status_level': 'neutral',
            'average_ssim': 1.0,
            'min_ssim': 1.0,
            'max_pixel_diff': 0.0,
            'low_change_count': 0,
            'moderate_change_count': 0,
            'high_change_count': 0,
            'most_significant_transition': None,
            'observations': ['Video duration was too short to yield multiple sampled frames.'],
            'disclaimer': (
                'Academic IVP Disclaimer: Video difference analysis evaluates inter-frame structural variance. '
                'Visual transitions may stem from motion, scene cuts, or editing. Results require contextual review.'
            ),
        }

    ssim_values = [t['ssim_score'] for t in transitions]
    pixel_diffs = [t['mean_pixel_diff'] for t in transitions]

    avg_ssim = float(np.mean(ssim_values))
    min_ssim = float(np.min(ssim_values))
    max_pixel_diff = float(np.max(pixel_diffs))

    low_count = sum(1 for t in transitions if t['level_code'] == 'low')
    med_count = sum(1 for t in transitions if t['level_code'] == 'medium')
    high_count = sum(1 for t in transitions if t['level_code'] == 'high')

    # Identify the transition with the lowest SSIM (most significant visual change)
    most_significant = min(transitions, key=lambda t: t['ssim_score'])
    sig_range_str = f"{most_significant['from_timestamp']:.2f}s → {most_significant['to_timestamp']:.2f}s"
    most_significant_info = {
        'from_timestamp': most_significant['from_timestamp'],
        'to_timestamp': most_significant['to_timestamp'],
        'range_str': sig_range_str,
        'ssim_score': most_significant['ssim_score'],
        'change_level': most_significant['change_level'],
        'level_code': most_significant['level_code'],
    }

    observations: list[str] = [
        f"Extracted and compared {len(transitions) + 1} representative frames across {metadata['duration']}s of video.",
        f"Average inter-frame SSIM similarity: {avg_ssim:.4f} (minimum SSIM: {min_ssim:.4f}).",
    ]

    # Neutral, evidence-based overall classification
    if high_count > 0 or med_count > 0:
        overall_status = "Visual Transition Detected — Review Recommended"
        status_level = "high" if high_count > 0 else "medium"
        observations.append(
            f"Most significant transition detected at {sig_range_str} (SSIM: {most_significant['ssim_score']:.4f}, {most_significant['change_level']})."
        )
        if high_count > 0 and med_count > 0:
            observations.append(
                f"Identified {high_count} high and {med_count} moderate visual transition(s) across the sequence."
            )
        elif high_count > 0:
            observations.append(
                f"Identified {high_count} high visual transition(s) indicating significant structural disparity or scene change."
            )
        else:
            observations.append(
                f"Identified {med_count} moderate visual transition(s) indicating notable structural or pixel-level disparity."
            )
    else:
        overall_status = "No Significant Sampled-Frame Changes"
        status_level = "low"
        observations.append(
            "High structural similarity maintained across all consecutive sampled frames with no significant visual transitions detected."
        )

    disclaimer = (
        "Academic IVP Disclaimer: Frame difference analysis measures temporal visual variance between sampled frames. "
        "Visual transitions may result from camera movement, scene edits, lighting shifts, or content alterations. "
        "These metrics characterize visual change objectively and do not prove or disprove intentional forgery."
    )

    return {
        'overall_status': overall_status,
        'status_level': status_level,
        'average_ssim': round(avg_ssim, 4),
        'min_ssim': round(min_ssim, 4),
        'max_pixel_diff': round(max_pixel_diff, 2),
        'low_change_count': low_count,
        'moderate_change_count': med_count,
        'high_change_count': high_count,
        'most_significant_transition': most_significant_info,
        'observations': observations,
        'disclaimer': disclaimer,
    }


def process_video_file(
    video_bytes: bytes,
    filename: str,
    sample_interval_sec: float = 1.0,
) -> dict:
    """
    Main processing entrypoint for video forensic analysis.
    Safely writes raw bytes to a temporary file, performs extraction and analysis,
    and guarantees resource cleanup.

    Args:
        video_bytes: Raw bytes of uploaded video file.
        filename: Name of the uploaded file.
        sample_interval_sec: Sampling rate in seconds (default 1.0s).

    Returns:
        Structured dictionary ready for JSON response serialization.
    """
    _, ext = os.path.splitext(filename.lower())
    if ext not in SUPPORTED_EXTENSIONS:
        ext = '.mp4'

    temp_file = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    temp_path = temp_file.name

    try:
        temp_file.write(video_bytes)
        temp_file.flush()
        temp_file.close()

        # 1. Validate video properties
        metadata = validate_video_file(temp_path, filename)

        # 2. Extract representative frames
        raw_frames, frame_info = extract_sampled_frames(
            temp_path,
            fps=metadata['fps'],
            total_frames=metadata['total_frames'],
            sample_interval_sec=sample_interval_sec,
        )

        # 3. Analyze frame transitions
        transitions = analyze_frame_transitions(raw_frames, frame_info)

        # 4. Generate summary
        summary = summarize_video_analysis(metadata, transitions)

        return {
            'mode': 'video',
            'metadata': metadata,
            'sampled_frames': frame_info,
            'transitions': transitions,
            'summary': summary,
        }

    finally:
        if os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass
