import { useState, useEffect } from 'react';
import { Scan, RotateCcw, AlertCircle } from 'lucide-react';
import { Header } from './components/Header';
import { ModeToggle } from './components/ModeToggle';
import { UploadZone } from './components/UploadZone';
import { ConfidenceGauge } from './components/ConfidenceGauge';
import { FindingsPanel } from './components/FindingsPanel';
import { OcrPanel } from './components/OcrPanel';
import { ImageCard } from './components/ImageCard';
import { ReportButton } from './components/ReportButton';
import { LoadingOverlay } from './components/LoadingOverlay';
import { BackendWarning } from './components/BackendWarning';
import { analyzeSingleImage, compareImages, checkHealth } from './services/api';
import { AnalysisMode, AnalysisResult } from './types';

export default function App() {
  const [mode, setMode] = useState<AnalysisMode>('single');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [suspectedFile, setSuspectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setBackendOnline);
  }, []);

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    setResults(null);
    setError(null);
    setOriginalFile(null);
    setSuspectedFile(null);
  };

  const canAnalyze = mode === 'single' ? !!originalFile : !!(originalFile && suspectedFile);

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let result: AnalysisResult;
      if (mode === 'single') {
        result = await analyzeSingleImage(originalFile!);
      } else {
        result = await compareImages(originalFile!, suspectedFile!);
      }
      setResults(result);
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Ensure the backend is running.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
    setOriginalFile(null);
    setSuspectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      {loading && <LoadingOverlay mode={mode} />}

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {backendOnline === false && <BackendWarning />}

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Digital Forensic Analysis</h2>
          <p className="text-slate-400">
            Upload a screenshot to detect signs of digital manipulation using classical computer vision techniques.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <ModeToggle mode={mode} onChange={handleModeChange} />
            <p className="text-slate-500 text-sm">
              {mode === 'single'
                ? 'Analyze a single screenshot for signs of tampering'
                : 'Compare original and suspected edited images side-by-side'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <UploadZone
              label={mode === 'single' ? 'Screenshot to Analyze' : 'Original Image'}
              file={originalFile}
              onChange={setOriginalFile}
            />
            {mode === 'compare' && (
              <>
                <div className="hidden sm:flex items-center justify-center px-2">
                  <div className="h-full w-px bg-slate-700" />
                </div>
                <UploadZone
                  label="Suspected / Edited Image"
                  file={suspectedFile}
                  onChange={setSuspectedFile}
                />
              </>
            )}
          </div>

          {mode === 'compare' && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-300 text-sm">
                <strong>Comparison Mode:</strong> Upload the original image on the left and the suspected edited version on the right. The system will compare them using SSIM, pixel difference analysis, and ELA to identify manipulated regions.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium text-sm">Analysis Error</p>
                <p className="text-red-400/80 text-sm mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-600/20 disabled:shadow-none"
            >
              <Scan className="w-5 h-5" />
              {loading ? 'Analyzing...' : 'Run Forensic Analysis'}
            </button>
            {results && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3 border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-xl font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {results && (
          <div id="results-section" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Analysis Results</h3>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                results.confidence_score >= 30
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-green-500/10 border border-green-500/20 text-green-400'
              }`}>
                {results.verdict}
              </span>
            </div>

            <ConfidenceGauge score={results.confidence_score} verdict={results.verdict} />

            {results.mode === 'compare' && results.original_image && results.suspected_image && (
              <div>
                <h4 className="text-slate-300 text-sm font-medium uppercase tracking-widest mb-3">
                  Uploaded Images
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageCard title="Original Image" subtitle="Reference image" src={results.original_image} accent="green" />
                  <ImageCard title="Suspected Image" subtitle="Image under analysis" src={results.suspected_image} accent="red" />
                </div>
              </div>
            )}

            <div>
              <h4 className="text-slate-300 text-sm font-medium uppercase tracking-widest mb-3">
                Forensic Analysis Outputs
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ImageCard
                  title="ELA Output"
                  subtitle="Error Level Analysis — bright areas indicate manipulation"
                  src={results.ela_image}
                  accent="amber"
                />
                <ImageCard
                  title="Highlighted Regions"
                  subtitle="Bounding boxes around suspicious areas detected"
                  src={results.highlighted_image}
                  accent="red"
                />
                {results.diff_heatmap && (
                  <ImageCard
                    title="Difference Heatmap"
                    subtitle="Pixel-level differences between the two images"
                    src={results.diff_heatmap}
                    accent="blue"
                  />
                )}
              </div>
            </div>

            <FindingsPanel
              findings={results.findings}
              elaIntensity={results.ela_intensity}
              noiseScore={results.noise_score}
              suspiciousRegions={results.suspicious_regions}
              ssimScore={results.ssim_score}
            />

            <OcrPanel
              text={results.extracted_text}
              currencyAmounts={results.currency_amounts}
              numbersFound={results.numbers_found}
            />

            <ReportButton
              report={results.report}
              filename={`forensic_report_${new Date().toISOString().slice(0, 10)}.txt`}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">
            Screenshot Manipulation Detection System — Digital Forensics Project
          </p>
          <p className="text-slate-600 text-xs">
            Computer Vision + Cyber Law | IT Act 2000 | Indian Evidence Act Sec 65B
          </p>
        </div>
      </footer>
    </div>
  );
}
