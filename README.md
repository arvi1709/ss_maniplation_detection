# ImageGuard - Screenshot Manipulation Detection System

[![React](https://img.shields.io/badge/React-18-blue?style=flat&logo=react)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green?style=flat&logo=flask)](https://flask.palletsprojects.com/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.10-orange?style=flat&logo=opencv)](https://opencv.org/)
[![Python](https://img.shields.io/badge/Python-3.13-yellow?style=flat&logo=python)](https://python.org/)

Digital forensics web application to detect screenshot/image manipulation using classical computer vision techniques. Perfect for cyber law investigations (IT Act 2000, Evidence Act Sec 65B).

## 🚀 Features

- **Single Image Analysis**: Upload screenshot → ELA heatmap + highlighted tampering regions
- **Side-by-Side Comparison**: Original vs suspected → SSIM diff heatmap + pixel changes  
- **Multi-Modal Forensics**:
  - Error Level Analysis (ELA) - compression artifacts
  - Noise inconsistency detection
  - Edge analysis
  - OCR text/currency extraction (Tesseract)
- **Confidence Verdict**: 0-100 score + findings summary
- **Professional Reports**: Downloadable forensic analysis TXT
- **Drag & Drop UI**: React + Tailwind, instant results visualization

## 🛠 Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite 5
- Tailwind CSS 3 + Lucide React icons

**Backend:** 
- Flask 3.0 + Flask-CORS
- OpenCV 4.10+, scikit-image 0.24+, NumPy 1.26+, Pillow 10+
- pytesseract OCR (currency/text detection)

## 📋 Prerequisites (Windows 11 Tested)

1. **Node.js 18+** (`node --version`)
2. **Python 3.11-3.13** 
3. **Conda/Anaconda** (recommended for CV libs)
4. **Tesseract OCR**:
   ```
   winget install TesseractOCR.Tesseract
   # OR Download: https://github.com/UB-Mannheim/tesseract/wiki
   # Add `C:\\Program Files\\Tesseract-OCR` to PATH
   ```

## 🚀 Quick Start

```bash
# 1. Backend (CV deps via conda - fixes pip compile issues)
conda install scikit-image opencv pillow numpy -c conda-forge
pip install flask flask-cors pytesseract

# 2. Start backend API
cd backend
python app.py
# Backend running: http://localhost:5000

# 3. Frontend (new terminal)
cd ..
npm install
npm run dev
# Frontend: http://localhost:5173
```

**Auto-opens browser** - Drag/drop images or select files!

## 🎮 Usage

### Single Analysis Mode
1. Upload suspected screenshot
2. Get ELA heatmap, tampering highlights, OCR text, confidence score
3. Download forensic report

### Comparison Mode  
1. Original (left) + Suspected edited (right)
2. SSIM difference heatmap + all single analysis
3. Identifies exact manipulation regions

**Results include:**
```
CONFIDENCE: 87% (HIGH RISK)
VERDICT: TAMPERED
FINDINGS:
• ELA Intensity: 42 (HIGH)
• 3 Suspicious Regions (red boxes)
• Noise Inconsistency: 28%
• OCR: ₹45,000 extracted
```

## 📡 API Endpoints

```
GET  /api/health        # Backend status check
POST /api/analyze       # Single image (multipart 'image')
POST /api/compare       # Two images (multipart 'original' + 'suspected')
```

**Response:** Base64 images (ELA, heatmap, highlights), JSON metrics, full report.

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `scikit-image` compile fails | Use `conda install scikit-image -c conda-forge` |
| `pytesseract` No Tesseract | Install Tesseract + `tesseract --version` works? |
| CORS errors | Backend auto-CORS enabled |
| Space in username | Use quotes: `"C:\Users\SPARKZ EDUCATION\Desktop\..."` |
| Conda cleanup errors | Ignore - packages installed OK |
| BackendWarning in UI | Run `python backend/app.py` first |

**Common Commands:**
```bash
# Test backend: curl http://localhost:5000/api/health
# Frontend lint: npm run lint
# Build prod: npm run build
```

## ⚠️ Known Issues & Limitations

✅ **Fixed:** scikit-image Windows compilation (conda)
⚠️ **Tesseract langs**: English default (add `tessdata` for Hindi/others)
⚠️ **No proxy**: Dev CORS OK, prod needs nginx/Vite config
⚠️ **Classical CV only**: No deep learning (robust, no GPU)
⚠️ **File size**: <10MB recommended (resize in preprocessing)

## 📁 Backend Modules

```
modules/
├── comparison.py     # SSIM + diff heatmap
├── ela_analysis.py   # Error Level Analysis
├── noise_analysis.py # Noise pattern detection
├── ocr_analysis.py   # Tesseract + currency regex
├── edge_detection.py # Canny edges
├── preprocessing.py  # Resize/normalize
├── verdict.py        # Weighted confidence scoring
└── report_generator.py
```

## 🔮 Future Work

- [ ] Docker containerization
- [ ] ML models (CNN tampering detection)
- [ ] Multi-language OCR
- [ ] PDF reports with images
- [ ] Batch processing
- [ ] REST API auth/JWT

## 📄 License

MIT License - Free for cyber law, forensics, research.

**Developed for Digital Evidence Collection | Made with ❤️ for Cyber Investigators**

---
*Backend creates `input/`, `output/`, `reports/` dirs automatically.*

