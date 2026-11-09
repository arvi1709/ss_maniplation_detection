# Production Deployment Guide: ImageGuard

This guide provides step-by-step instructions to deploy ImageGuard to production:
- **Backend (Python Flask API)** on [Render](https://render.com)
- **Frontend (React + Vite SPA)** on [Vercel](https://vercel.com)

---

## Architecture Overview

```text
┌───────────────────────────────┐           HTTPS API Calls            ┌────────────────────────────────┐
│      Vercel (Frontend)        │ ───────────────────────────────────> │     Render (Backend API)       │
│  React + TypeScript + Vite    │ <─────────────────────────────────── │   Flask + Gunicorn + OpenCV    │
│  (Configured via VITE_API_URL)│             CORS Allowed             │  (Configured via FRONTEND_URL) │
└───────────────────────────────┘                                      └────────────────────────────────┘
```

---

## 1. Deploy the Backend on Render

### Step 1: Create a Web Service
1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository: `https://github.com/arvi1709/ss_maniplation_detection`.
4. Select the branch: `main`.

### Step 2: Configure Service Settings
| Field | Value | Notes |
|---|---|---|
| **Name** | `imageguard-backend` | Or any unique name you prefer |
| **Region** | Closest to your users | e.g. Frankfurt, Oregon, Singapore |
| **Branch** | `main` | Production branch |
| **Root Directory** | `backend` | Sets working directory to backend folder |
| **Runtime** | `Python 3` | |
| **Build Command** | `pip install -r requirements.txt` | Installs dependencies including headless OpenCV |
| **Start Command** | `gunicorn app:app` | Runs Flask WSGI app via Gunicorn |
| **Instance Type** | `Free` (or Starter) | 512 MB RAM is sufficient |

*(Optional alternative: If you leave **Root Directory** empty at repo root, use Build Command: `pip install -r backend/requirements.txt` and Start Command: `gunicorn --chdir backend app:app`)*

### Step 3: Configure Environment Variables
In the **Environment** tab on Render, add:

| Key | Value | Description |
|---|---|---|
| `PYTHON_VERSION` | `3.11.9` | Ensures a stable Python 3.11 environment |
| `FLASK_DEBUG` | `false` | Explicitly disables Flask debug mode |
| `FRONTEND_URL` | `*` *(or update with your Vercel URL)* | Restricts CORS to your Vercel app domain once known |

### Step 4: Health Check Path
Under **Advanced**:
- **Health Check Path**: `/api/health`

Click **Create Web Service**. Wait for the build to finish. Once live, Render will provide your public backend URL, for example:
`https://imageguard-backend.onrender.com`

---

## 2. Deploy the Frontend on Vercel

### Step 1: Import Project
1. Sign in to your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Select and import the `ss_maniplation_detection` repository.

### Step 2: Configure Build Settings
Vercel will automatically detect Vite. Confirm the settings:
| Setting | Value |
|---|---|
| **Framework Preset** | `Vite` |
| **Root Directory** | `./` (leave default repository root) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 3: Configure Environment Variables
Expand **Environment Variables** and add:

| Key | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://imageguard-backend.onrender.com/api` | Your Render backend URL + `/api` |

*(Note: The application automatically handles both `https://imageguard-backend.onrender.com` and `https://imageguard-backend.onrender.com/api`)*

### Step 4: Deploy
Click **Deploy**. Vercel will build and deploy the React application in ~1 minute, assigning a domain such as:
`https://ss-maniplation-detection.vercel.app`

---

## 3. Final Step: Lock Down Backend CORS

Once your Vercel URL is live:
1. Return to [Render Dashboard](https://dashboard.render.com/) -> `imageguard-backend` -> **Environment**.
2. Update `FRONTEND_URL`:
   ```env
   FRONTEND_URL=https://ss-maniplation-detection.vercel.app
   ```
   *(If you have a custom domain, you can provide multiple separated by commas: `https://ss-maniplation-detection.vercel.app,https://yourdomain.com`)*
3. Click **Save Changes**. Render will automatically restart the backend with strict CORS protection enabled.

---

## 4. Local Development

Your local environment remains completely unchanged:
- **Backend**:
  ```bash
  cd backend
  pip install -r requirements.txt
  python app.py
  ```
  Runs at `http://localhost:5000`
- **Frontend**:
  ```bash
  npm install
  npm run dev
  ```
  Runs at `http://localhost:5173` and automatically connects to `http://localhost:5000/api` when `VITE_API_URL` is omitted.

---

## 5. Notes & Verification

- **Free Tier Cold Starts**: Render free instances spin down after 15 minutes of inactivity. The first request after idle may take 30–50 seconds while the container initializes.
- **Tesseract OCR on Linux**: If Tesseract is not installed on the Linux host, the backend safely skips OCR text extraction and continues with ELA, SSIM comparison, difference heatmaps, noise analysis, edge detection, and video analysis without crashing.
- **Headless Video Processing**: The backend utilizes `opencv-python-headless` and does not require an X11 server or GUI display on Linux.
