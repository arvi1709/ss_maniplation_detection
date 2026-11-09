import { useState, useEffect } from 'react';
import { Play, RotateCcw, AlertCircle, Film, Sparkles, Layers, Sliders } from 'lucide-react';
import { Header } from './components/Header';
import { ModeToggle } from './components/ModeToggle';
import { UploadZone } from './components/UploadZone';
import { VideoUploadZone } from './components/VideoUploadZone';
import { VideoAnalysisPanel } from './components/VideoAnalysisPanel';
import { ConfidenceGauge } from './components/ConfidenceGauge';
import { FindingsPanel } from './components/FindingsPanel';
import { OcrPanel } from './components/OcrPanel';
import { ImageCard } from './components/ImageCard';
import { ReportButton } from './components/ReportButton';
import { LoadingOverlay } from './components/LoadingOverlay';
import { BackendWarning } from './components/BackendWarning';
import { analyzeSingleImage, compareImages, analyzeVideo, checkHealth } from './services/api';
import { AnalysisMode, AnalysisResult, VideoAnalysisResult } from './types';

export default function App() {
  const [mode, setMode] = useState<AnalysisMode>('single');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [suspectedFile, setSuspectedFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [videoResults, setVideoResults] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setBackendOnline);
  }, []);

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    setResults(null);
    setVideoResults(null);
    setError(null);
    setOriginalFile(null);
    setSuspectedFile(null);
    setVideoFile(null);
  };

  const canAnalyze =
    mode === 'single'
      ? !!originalFile
      : mode === 'compare'
      ? !!(originalFile && suspectedFile)
      : !!videoFile;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setVideoResults(null);

    try {
      if (mode === 'single') {
        const result = await analyzeSingleImage(originalFile!);
        setResults(result);
      } else if (mode === 'compare') {
        const result = await compareImages(originalFile!, suspectedFile!);
        setResults(result);
      } else {
        const vResult = await analyzeVideo(videoFile!);
        setVideoResults(vResult);
      }

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Processing failed. Ensure the backend is reachable.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setVideoResults(null);
    setError(null);
    setOriginalFile(null);
    setSuspectedFile(null);
    setVideoFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getVerdictBadgeStyle = (verdict: string, score: number) => {
    if (verdict === 'Differences Detected' || verdict === 'Possible Manipulation Detected') {
      return 'bg-rose-50 border-rose-200 text-rose-800';
    }
    if (verdict === 'Unable to Compare Reliably') {
      return 'bg-amber-50 border-amber-200 text-amber-800';
    }
    if (verdict === 'No Significant Differences Detected' || verdict === 'No Manipulation Detected') {
      return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    }
    return score >= 30
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />

      {loading && <LoadingOverlay mode={mode} />}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {backendOnline === false && <BackendWarning />}

        {/* Hero Section */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Image &amp; Video Processing Laboratory</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Explore Image and Video Processing
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Analyze images, compare visual differences, and explore temporal changes in videos using classical computer vision techniques.
            </p>

            {/* Techniques Pills */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Structural Similarity (SSIM)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                Error Level Analysis (ELA)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                ORB Feature Alignment
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                Temporal Frame Differencing
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Noise &amp; Edge Profiling
              </span>
            </div>
          </div>
        </section>

        {/* Processing Workbench */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-900 font-bold text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Select Laboratory Mode
              </h3>
              <span className="text-slate-400 text-xs">Step 1 of 2</span>
            </div>
            <ModeToggle mode={mode} onChange={handleModeChange} />
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-900 font-bold text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Upload Input Data
              </h3>
              <span className="text-slate-400 text-xs">Step 2 of 2</span>
            </div>

            {/* Mode-specific upload zone */}
            {mode === 'video' ? (
              <VideoUploadZone
                file={videoFile}
                onChange={setVideoFile}
                onError={setError}
              />
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <UploadZone
                  label={mode === 'single' ? 'Input Image to Process' : 'Original Reference Image (Baseline)'}
                  file={originalFile}
                  onChange={setOriginalFile}
                />
                {mode === 'compare' && (
                  <UploadZone
                    label="Comparison Image (Suspected / Modified)"
                    file={suspectedFile}
                    onChange={setSuspectedFile}
                  />
                )}
              </div>
            )}
          </div>

          {/* Mode Guidance Notes */}
          {mode === 'compare' && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
              <strong className="font-semibold text-blue-950">Comparative Mode:</strong> Upload the reference baseline image on the left and the suspected image on the right. The system registers both images using ORB feature matching and computes localized SSIM structural difference heatmaps and contour bounding boxes.
            </div>
          )}

          {mode === 'video' && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
              <strong className="font-semibold text-blue-950">Video Mode:</strong> Upload an MP4 or AVI video (up to 60s, max 100 MB). OpenCV extracts representative frames at 1.0s intervals, computes inter-frame SSIM and pixel disparity, and identifies significant visual transitions.
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Processing Error</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-all duration-150 shadow-xs hover:shadow disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              {mode === 'video' ? <Film className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              {loading
                ? 'Processing...'
                : mode === 'video'
                ? 'Run Video Temporal Analysis'
                : mode === 'compare'
                ? 'Run Image Comparison'
                : 'Run Image Processing Pipeline'}
            </button>

            {(results || videoResults) && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Pipeline
              </button>
            )}
          </div>
        </section>

        {/* Results Section */}
        <div id="results-section">
          {mode === 'video' && videoResults && (
            <VideoAnalysisPanel results={videoResults} />
          )}

          {mode !== 'video' && results && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Laboratory Processing Results</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Multi-modal visual outputs and quantitative diagnostic metrics
                  </p>
                </div>
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${getVerdictBadgeStyle(
                    results.verdict,
                    results.confidence_score
                  )}`}
                >
                  {results.verdict}
                </span>
              </div>

              <ConfidenceGauge
                score={results.confidence_score}
                verdict={results.verdict}
                mode={results.mode}
              />

              {results.mode === 'compare' && results.original_image && results.suspected_image && (
                <div className="space-y-3">
                  <h4 className="text-slate-700 text-xs font-bold uppercase tracking-wider">
                    Input Image Pair
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ImageCard
                      title="Original Reference Image"
                      subtitle="Baseline reference input for comparative alignment"
                      src={results.original_image}
                      accent="green"
                    />
                    <ImageCard
                      title="Comparison Image"
                      subtitle="Subject image evaluated for visual discrepancies"
                      src={results.suspected_image}
                      accent="red"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-slate-700 text-xs font-bold uppercase tracking-wider">
                  Visual Processing Feature Maps
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.diff_heatmap && (
                    <ImageCard
                      title="Difference Heatmap"
                      subtitle="SSIM difference field (Blue = match, Red = modified)"
                      src={results.diff_heatmap}
                      accent="blue"
                    />
                  )}
                  <ImageCard
                    title="Highlighted Regions"
                    subtitle="Contour bounding boxes around detected discrepancies"
                    src={results.highlighted_image}
                    accent="red"
                  />
                  <ImageCard
                    title="Error Level Analysis (ELA)"
                    subtitle="JPEG compression error residual distribution"
                    src={results.ela_image}
                    accent="amber"
                  />
                </div>
              </div>

              <FindingsPanel
                findings={results.findings}
                elaIntensity={results.ela_intensity}
                noiseScore={results.noise_score}
                suspiciousRegions={results.suspicious_regions}
                ssimScore={results.ssim_score}
                alignmentInfo={results.alignment_info}
              />

              <OcrPanel
                text={results.extracted_text}
                currencyAmounts={results.currency_amounts}
                numbersFound={results.numbers_found}
              />

              <ReportButton
                report={results.report}
                filename={`ivp_analysis_report_${new Date().toISOString().slice(0, 10)}.txt`}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="text-slate-800 text-sm font-semibold">
              ImageGuard Studio — Image &amp; Video Processing Laboratory
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              Academic Computer Vision Project • B.Tech Image and Video Processing (IVP)
            </p>
          </div>
          <p className="text-slate-400 text-xs">
            OpenCV • scikit-image • React 18 • Flask
          </p>
        </div>
      </footer>
    </div>
  );
}
