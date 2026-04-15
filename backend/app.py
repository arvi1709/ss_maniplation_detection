"""
app.py
------
Main Flask application for the Screenshot Manipulation Detection System.
Exposes two primary API endpoints:
  POST /api/analyze  — Single image forensic analysis
  POST /api/compare  — Two-image comparison (original vs. suspected)
  GET  /api/health   — Health check
"""

import base64
import os

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

from modules.comparison import compare_images
from modules.edge_detection import detect_edges
from modules.ela_analysis import perform_ela
from modules.noise_analysis import detect_noise_inconsistency
from modules.ocr_analysis import extract_text
from modules.preprocessing import preprocess_image, resize_for_comparison
from modules.report_generator import generate_text_report
from modules.verdict import calculate_verdict

app = Flask(__name__)
CORS(app)

os.makedirs('input', exist_ok=True)
os.makedirs('output', exist_ok=True)
os.makedirs('reports', exist_ok=True)


def _to_base64(img_bgr: np.ndarray) -> str:
    """Encode a BGR numpy array as a base64 PNG string."""
    _, buffer = cv2.imencode('.png', img_bgr)
    return base64.b64encode(buffer).decode('utf-8')


def _highlight_ela_regions(img_rgb: np.ndarray, ela_img: np.ndarray) -> np.ndarray:
    """
    Use the ELA output to detect and box suspicious regions.
    Converts ELA to grayscale, thresholds, finds contours,
    then draws red bounding rectangles on a copy of the original image.
    """
    ela_bgr = cv2.cvtColor(ela_img, cv2.COLOR_RGB2BGR)
    ela_gray = cv2.cvtColor(ela_bgr, cv2.COLOR_BGR2GRAY)
    _, ela_thresh = cv2.threshold(ela_gray, 25, 255, cv2.THRESH_BINARY)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    ela_thresh = cv2.morphologyEx(ela_thresh, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(ela_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    highlighted_rgb = img_rgb.copy()
    highlighted_bgr = cv2.cvtColor(highlighted_rgb, cv2.COLOR_RGB2BGR)
    count = 0

    for contour in contours:
        if cv2.contourArea(contour) > 200:
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(highlighted_bgr, (x, y), (x + w, y + h), (0, 0, 255), 2)
            cv2.putText(highlighted_bgr, 'Suspect', (x, max(y - 5, 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
            count += 1

    return highlighted_bgr, count


@app.route('/api/health', methods=['GET'])
def health():
    """Health-check endpoint used by the frontend to detect backend availability."""
    return jsonify({'status': 'ok', 'message': 'Backend is running'})


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Single-image forensic analysis endpoint.

    Accepts: multipart/form-data with field 'image'.
    Returns: JSON with ELA image, highlighted regions, OCR text,
             confidence score, verdict, and full forensic report.
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided. Send an "image" field.'}), 400

        file = request.files['image']
        image_bytes = file.read()
        filename = file.filename or 'unknown.png'

        img, img_rgb, _ = preprocess_image(image_bytes)

        ela_img, ela_intensity = perform_ela(image_bytes)

        ocr_data = extract_text(img)

        noise_score, _ = detect_noise_inconsistency(img)

        _, edge_count = detect_edges(img)

        highlighted_bgr, suspicious_count = _highlight_ela_regions(img_rgb, ela_img)

        ela_bgr = cv2.cvtColor(ela_img, cv2.COLOR_RGB2BGR)

        confidence, verdict, findings = calculate_verdict(
            ssim_score=None,
            suspicious_regions=suspicious_count,
            ela_intensity=ela_intensity,
            ocr_data=ocr_data,
            noise_score=noise_score,
        )

        report = generate_text_report(
            image_filename=filename,
            confidence_score=confidence,
            verdict=verdict,
            findings=findings,
            ocr_data=ocr_data,
            mode='single',
        )

        return jsonify({
            'mode': 'single',
            'ela_image': _to_base64(ela_bgr),
            'highlighted_image': _to_base64(highlighted_bgr),
            'extracted_text': ocr_data.get('full_text', ''),
            'currency_amounts': ocr_data.get('currency_amounts', []),
            'numbers_found': ocr_data.get('numbers_found', []),
            'confidence_score': confidence,
            'verdict': verdict,
            'findings': findings,
            'ela_intensity': ela_intensity,
            'noise_score': noise_score,
            'suspicious_regions': suspicious_count,
            'edge_count': edge_count,
            'report': report,
        })

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@app.route('/api/compare', methods=['POST'])
def compare():
    """
    Two-image comparison endpoint.

    Accepts: multipart/form-data with fields 'original' and 'suspected'.
    Returns: JSON with SSIM score, difference heatmap, highlighted tampered regions,
             ELA analysis, OCR results, confidence score, verdict, and forensic report.
    """
    try:
        if 'original' not in request.files or 'suspected' not in request.files:
            return jsonify({'error': 'Both "original" and "suspected" image fields are required.'}), 400

        orig_file = request.files['original']
        susp_file = request.files['suspected']

        orig_bytes = orig_file.read()
        susp_bytes = susp_file.read()

        orig_img, orig_rgb, _ = preprocess_image(orig_bytes)
        susp_img, susp_rgb, _ = preprocess_image(susp_bytes)

        orig_resized, susp_resized = resize_for_comparison(orig_img, susp_img)

        ssim_score, diff_heatmap, highlighted_cmp, suspicious_regions = compare_images(
            orig_resized, susp_resized
        )

        ela_img, ela_intensity = perform_ela(susp_bytes)

        ocr_data = extract_text(susp_img)

        noise_score, _ = detect_noise_inconsistency(susp_img)

        confidence, verdict, findings = calculate_verdict(
            ssim_score=ssim_score,
            suspicious_regions=len(suspicious_regions),
            ela_intensity=ela_intensity,
            ocr_data=ocr_data,
            noise_score=noise_score,
        )

        report = generate_text_report(
            image_filename=f'{orig_file.filename} vs {susp_file.filename}',
            confidence_score=confidence,
            verdict=verdict,
            findings=findings,
            ssim_score=ssim_score,
            ocr_data=ocr_data,
            mode='compare',
        )

        ela_bgr = cv2.cvtColor(ela_img, cv2.COLOR_RGB2BGR)

        return jsonify({
            'mode': 'compare',
            'original_image': _to_base64(orig_img),
            'suspected_image': _to_base64(susp_img),
            'diff_heatmap': _to_base64(diff_heatmap),
            'highlighted_image': _to_base64(highlighted_cmp),
            'ela_image': _to_base64(ela_bgr),
            'extracted_text': ocr_data.get('full_text', ''),
            'currency_amounts': ocr_data.get('currency_amounts', []),
            'numbers_found': ocr_data.get('numbers_found', []),
            'ssim_score': ssim_score,
            'confidence_score': confidence,
            'verdict': verdict,
            'findings': findings,
            'ela_intensity': ela_intensity,
            'noise_score': noise_score,
            'suspicious_regions': len(suspicious_regions),
            'report': report,
        })

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
