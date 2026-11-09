# ImageGuard — Digital Image & Video Forgery Detection System

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.10-5C3EE8?style=flat&logo=opencv&logoColor=white)](https://opencv.org/)
[![scikit-image](https://img.shields.io/badge/scikit--image-0.24-green?style=flat)](https://scikit-image.org/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **Academic Project — B.Tech Image and Video Processing (IVP)**  
> Digital forensics web application for detecting screenshot alterations, transaction tampering, and video sequence transitions using classical computer vision algorithms and explainable metrics.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Capabilities & Analysis Modes](#-key-capabilities--analysis-modes)
  - [1. Single-Image Forensic Analysis](#1-single-image-forensic-analysis)
  - [2. Dual-Image Comparison (Original vs. Suspected)](#2-dual-image-comparison-original-vs-suspected)
  - [3. Video Frame Analysis](#3-video-frame-analysis)
- [Computer Vision & Image Processing Techniques](#-computer-vision--image-processing-techniques)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites & System Requirements](#-prerequisites--system-requirements)
- [Installation & Quick Start](#-installation--quick-start)
- [API Reference](#-api-reference)
- [Automated Testing Suite](#-automated-testing-suite)
- [Project Directory Structure](#-project-directory-structure)
- [Forensic & Academic Disclaimers](#-forensic--academic-disclaimers)
- [License](#-license)

---

## 🔍 Overview

**ImageGuard** is designed to inspect digital screenshots (e.g., UPI payment receipts, chat transcripts, account statements) and video clips for signs of manipulation. Unlike opaque deep learning models, ImageGuard emphasizes **transparent, explainable classical computer vision** techniques:
- Error Level Analysis (ELA) for JPEG compression anomalies.
- Structural Similarity Index Measure (SSIM) for spatial and temporal disparity.
- Noise distribution profiling & Canny edge variance.
- Optical Character Recognition (OCR) for transaction metadata and INR currency extraction.
- ORB feature matching and homography for reliable image alignment.
- Consecutive frame extraction, difference heatmaps, and evidence-based transition tracking in video sequences.

---

## ⚡ Key Capabilities & Analysis Modes

ImageGuard features three dedicated forensic investigation modes:

### 1. Single-Image Forensic Analysis
*Best for: Inspecting a single suspected screenshot when no reference image exists.*
- **Error Level Analysis (ELA)**: Resaves the image at a known quality level (90%) and amplifies pixel differences to detect localized compression inconsistencies.
- **Noise Analysis**: Computes high-frequency residual noise using median/Gaussian filters to identify spliced regions with non-matching noise variance.
- **Edge Analysis**: Canny edge detection identifies abnormal edge distributions or smoothing artifacts around pasted text/numbers.
- **OCR Text & Currency Extraction**: Utilizes Tesseract OCR with tailored regex pattern matching for transaction amounts (`₹` / `INR`), UPI IDs, and timestamps.
- **Forensic Report Generation**: Generates downloadable text reports documenting all observed metrics.

### 2. Dual-Image Comparison (Original vs. Suspected)
*Best for: Verifying a suspected altered image against a trusted reference.*
- **Feature-Based Alignment**: Uses ORB (Oriented FAST and Rotated BRIEF) feature detection and RANSAC homography to compensate for slight viewpoint variations or scaling.
- **Structural Similarity (SSIM)**: Compares localized luminance, contrast, and structural metrics across full resolution.
- **Difference Heatmap & Contours**: Computes difference fields, applies Otsu thresholding and morphological filtering, and draws bounding boxes around meaningful modified areas while filtering out minor subpixel noise.
- **Transparent Academic Verdicts**: Replaces ambiguous scores with clear, evidence-based results:
  - `Differences Detected`
  - `No Significant Differences Detected`
  - `Unable to Compare Reliably`

### 3. Video Frame Analysis
*Best for: Inspecting video recordings for sudden cuts, scene replacements, or spliced amounts.*
- **Temporal Frame Extraction**: Samples representative frames at configurable intervals (1.0s default) using OpenCV `cv2.VideoCapture`.
- **Consecutive Pair SSIM & Heatmaps**: Evaluates structural similarity between consecutive sampled frames and renders JET colormap heatmaps for visual inspection.
- **Neutral Academic Classifications**:
  - `Low Visual Change` ($SSIM \ge 0.94$)
  - `Moderate Visual Change` ($0.80 \le SSIM < 0.94$)
  - `High Visual Change` ($SSIM < 0.80$)
- **Overall Sequence Status**:
  - `Visual Transition Detected — Review Recommended` (flags altered frames, such as a transition from a ₹1,000 receipt to a ₹2,000 receipt).
  - `No Significant Sampled-Frame Changes`
- **Significant Transition Pinpointing**: Automatically highlights the timestamp range of the most significant transition (e.g., `2.00s → 3.00s`) with interactive one-click heatmap inspection.

---

## 🔬 Computer Vision & Image Processing Techniques

| Technique | Image Processing Concept | Purpose in ImageGuard |
|-----------|--------------------------|-----------------------|
| **SSIM** | Structural Similarity ($\mu_x, \sigma_x^2, \sigma_{xy}$) | Spatial image comparison & temporal video transition scoring |
| **ELA** | Differential Compression Residuals | Highlighting copy-paste tampering in lossy JPEG screenshots |
| **ORB + RANSAC** | Feature Matching & Perspective Transformation | Automatic image registration between original and suspected images |
| **Morphological Filters** | Dilation & Erosion ($3 \times 3$ / $5 \times 5$ kernels) | Noise artifact elimination and connected-component consolidation |
| **Otsu Thresholding** | Automatic Bimodal Histogram Separation | Segmenting significant structural differences from background |
| **Noise Residuals** | High-Pass Filtering ($I - \text{median}(I)$) | Detecting inconsistent sensor/rendering noise patterns |
| **OCR + Regex** | Character Recognition & Pattern Extraction | Extracting financial figures, dates, and UPI IDs for validation |

---

## 🏛 System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    React + TypeScript UI                    │
│   (Single Image Mode  |  Comparison Mode  |  Video Mode)    │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API (JSON + Base64)
┌──────────────────────────────▼──────────────────────────────┐
│                    Flask Backend (app.py)                   │
├──────────────────────────────┬──────────────────────────────┤
│ Image Processing Core:       │ Video Processing Core:       │
│ • modules/preprocessing.py   │ • modules/video_analysis.py  │
│ • modules/comparison.py      │   - cv2.VideoCapture         │
│ • modules/ela_analysis.py    │   - Temporal SSIM            │
│ • modules/noise_analysis.py  │   - Difference Heatmaps      │
│ • modules/ocr_analysis.py    │   - Transition Evaluation    │
│ • modules/verdict.py         │   - Clean Resource Teardown  │
│ • modules/report_generator.py│                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 💻 Tech Stack

### Frontend
- **React 18** & **TypeScript**
- **Vite 8** (Lightning-fast HMR and bundle optimization)
- **Tailwind CSS 3** (Custom dark-themed forensic UI)
- **Lucide React** (Clean visual icon set)

### Backend
- **Python 3.11 / 3.12 / 3.13**
- **Flask 3.0** & **Flask-CORS**
- **OpenCV 4.10** (`opencv-python`)
- **scikit-image 0.24**
- **NumPy 1.26** & **Pillow 10.4**
- **pytesseract 0.3** (Tesseract OCR Engine)

---

## 📋 Prerequisites & System Requirements

- **Operating System**: Windows 10/11, Ubuntu 20.04+, or macOS
- **Node.js**: v18.0.0 or higher
- **Python**: 3.11 to 3.13
- **Tesseract OCR**:
  - *Windows*: Download installer from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) or via winget:
    ```bash
    winget install TesseractOCR.Tesseract
    ```
    *(Ensure `C:\Program Files\Tesseract-OCR` is added to your system `PATH`)*
  - *Linux (Ubuntu/Debian)*:
    ```bash
    sudo apt update && sudo apt install tesseract-ocr
    ```

---

## 🚀 Installation & Quick Start

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# (Recommended) Install CV dependencies using Conda or Virtualenv
pip install -r requirements.txt

# Start the Flask API server
python app.py
```
> The backend will start on **`http://localhost:5000`** (or `http://127.0.0.1:5000`).

### 2. Frontend Setup

```bash
# In a new terminal, navigate to the project root
npm install

# Start the Vite development server
npm run dev
```
> The frontend will start on **`http://localhost:5173`**. Open this URL in your web browser.

---

## 📡 API Reference

### Health Check
```http
GET /api/health
```
**Response (200 OK):**
```json
{
  "status": "healthy",
  "ocr_available": true
}
```

---

### Single Image Analysis
```http
POST /api/analyze
Content-Type: multipart/form-data
```
| Field | Type | Description |
|-------|------|-------------|
| `image` | File | JPEG, PNG, WEBP screenshot |

**Response (200 OK):** Base64 encoded ELA preview, heatmap preview, detected regions, OCR text, confidence breakdown, and verdict.

---

### Dual Image Comparison
```http
POST /api/compare
Content-Type: multipart/form-data
```
| Field | Type | Description |
|-------|------|-------------|
| `original` | File | Reference unaltered screenshot |
| `suspected` | File | Suspected altered screenshot |

**Response (200 OK):**
```json
{
  "ssim_score": 0.9812,
  "comparison_verdict": "Differences Detected",
  "changed_regions_count": 2,
  "difference_heatmap": "data:image/png;base64,...",
  "highlighted_image": "data:image/png;base64,...",
  "analysis_explanation": "Identified 2 significant altered region(s)."
}
```

---

### Video Analysis
```http
POST /api/video/analyze
Content-Type: multipart/form-data
```
| Field | Type | Description |
|-------|------|-------------|
| `video` | File | MP4 or AVI video file (max 100 MB, $\le$ 60 sec) |

**Response (200 OK):**
```json
{
  "video_filename": "sample_payment.mp4",
  "duration_seconds": 6.0,
  "fps": 30.0,
  "total_frames": 180,
  "sampled_frame_count": 7,
  "sampled_frames": [...],
  "transitions": [
    {
      "from_idx": 2,
      "to_idx": 3,
      "from_timestamp": 2.0,
      "to_timestamp": 3.0,
      "ssim": 0.8741,
      "change_level": "Moderate Visual Change",
      "difference_heatmap": "data:image/jpeg;base64,..."
    }
  ],
  "summary": {
    "overall_status": "Visual Transition Detected — Review Recommended",
    "min_ssim": 0.8741,
    "most_significant_transition": {
      "from_timestamp": 2.0,
      "to_timestamp": 3.0,
      "range_str": "2.00s → 3.00s",
      "ssim": 0.8741,
      "change_level": "Moderate Visual Change"
    }
  }
}
```

---

## 🧪 Automated Testing Suite

The project includes unit, integration, and regression test suites covering both image comparison and video processing:

### Running Image Comparison Tests
```bash
python backend/test_comparison.py
```
*Validates: Identical image pairs, modified text/amounts, noise artifact filtering, mismatched image dimensions, corrupted image handling, and API integration.*

### Running Video Analysis Tests
```bash
python backend/test_video_analysis.py
```
*Validates: MP4 metadata decoding, static video continuity, visible scene cuts, moderate transitions (e.g. ₹1,000 → ₹2,000 swap), corrupted video rejection, duration limit constraints, sampling rate accuracy, and strict academic neutrality verification.*

### Running Frontend Typecheck & Build
```bash
npm run typecheck
npm run build
```

---

## 📂 Project Directory Structure

```text
ss_manipulation_detection/
├── backend/
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── comparison.py       # SSIM comparison, contour bounding & alignment
│   │   ├── edge_detection.py   # Canny edge analysis
│   │   ├── ela_analysis.py     # Error Level Analysis (ELA)
│   │   ├── noise_analysis.py   # Noise inconsistency detection
│   │   ├── ocr_analysis.py     # Tesseract OCR & currency pattern extraction
│   │   ├── preprocessing.py    # Dimension validation & normalization
│   │   ├── report_generator.py # Forensic TXT report generator
│   │   ├── verdict.py          # Decision logic & verdict classification
│   │   └── video_analysis.py   # Video extraction, SSIM transitions & summary
│   ├── app.py                  # Flask REST application & endpoints
│   ├── requirements.txt        # Python backend dependencies
│   ├── test_comparison.py      # Image comparison test suite
│   └── test_video_analysis.py  # Video analysis test suite
├── src/
│   ├── components/
│   │   ├── BackendWarning.tsx     # Connection status banner
│   │   ├── ConfidenceGauge.tsx    # Forensic confidence gauge widget
│   │   ├── FindingsPanel.tsx      # Diagnostic observations panel
│   │   ├── Header.tsx             # Navigation header
│   │   ├── ImageCard.tsx          # Dual comparison image viewer
│   │   ├── LoadingOverlay.tsx     # Processing spinner overlay
│   │   ├── ModeToggle.tsx         # Single / Comparison / Video toggle
│   │   ├── OcrPanel.tsx           # Extracted text & currency breakdown
│   │   ├── ReportButton.tsx       # Forensic report export button
│   │   ├── UploadZone.tsx         # Drag-and-drop image upload
│   │   ├── VideoAnalysisPanel.tsx # Frame timeline, heatmaps & transition viewer
│   │   └── VideoUploadZone.tsx    # Drag-and-drop video upload
│   ├── services/
│   │   └── api.ts              # Frontend API client
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces & types
│   ├── App.tsx                 # Root application state & view controller
│   ├── main.tsx                # React DOM root entry
│   └── index.css               # Global styling & Tailwind directives
├── package.json                # Frontend package configuration
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite bundler configuration
└── README.md                   # Project documentation
```

---

## ⚖️ Forensic & Academic Disclaimers

1. **Digital Evidence Collection**: ImageGuard provides forensic indicators to assist human analysts in detecting digital manipulation under frameworks such as Section 65B of the Indian Evidence Act, 1872 / Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.
2. **Academic Neutrality**: Visual discrepancies, ELA highlights, or SSIM drops can stem from re-compression, social media transmission, platform resizing, or camera movement. The system provides objective observations without claiming definitive legal proof of forgery or natural motion.
3. **Classical CV Scope**: The system deliberately uses deterministic computer vision methods without black-box deep generative models, ensuring reproducible and auditable results suitable for academic study in Image and Video Processing.

---

## 📄 License

This project is open-source and licensed under the **MIT License**.
