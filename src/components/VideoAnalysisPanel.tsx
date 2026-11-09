import { useState } from 'react';
import {
  Film,
  Clock,
  Activity,
  Layers,
  AlertTriangle,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
} from 'lucide-react';
import { VideoAnalysisResult, VideoSampledFrame, VideoTransition } from '../types';

interface VideoAnalysisPanelProps {
  results: VideoAnalysisResult;
}

export function VideoAnalysisPanel({ results }: VideoAnalysisPanelProps) {
  const { metadata, sampled_frames, transitions, summary } = results;

  // Default selected transition to the one with the highest visual change (lowest SSIM)
  const [selectedTransitionIdx, setSelectedTransitionIdx] = useState<number>(() => {
    if (!transitions || transitions.length === 0) return 0;
    let minIdx = 0;
    let minScore = transitions[0].ssim_score;
    for (let i = 1; i < transitions.length; i++) {
      if (transitions[i].ssim_score < minScore) {
        minScore = transitions[i].ssim_score;
        minIdx = i;
      }
    }
    return minIdx;
  });

  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null);

  const selectedTransition: VideoTransition | undefined = transitions[selectedTransitionIdx] || transitions[0];

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'low':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-700';
    }
  };

  const getBadgeClass = (badge: 'green' | 'amber' | 'red') => {
    switch (badge) {
      case 'red':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'green':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Overall Verdict */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-lg">
              Video Processing Analysis
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Temporal frame extraction, inter-frame structural similarity (SSIM), and difference heatmaps
            </p>
          </div>
        </div>
        <span
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(
            summary.status_level
          )}`}
        >
          {summary.overall_status}
        </span>
      </div>

      {/* 2. Video Metadata & Aggregate Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Duration
          </div>
          <p className="text-xl font-bold text-slate-800 font-mono">{metadata.duration}s</p>
          <p className="text-slate-400 text-[11px] mt-0.5">{metadata.file_size_mb} MB</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase mb-1">
            <Film className="w-3.5 h-3.5 text-teal-600" /> Framerate
          </div>
          <p className="text-xl font-bold text-slate-800 font-mono">{metadata.fps} FPS</p>
          <p className="text-slate-400 text-[11px] mt-0.5">{metadata.total_frames} frames</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase mb-1">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-600" /> Resolution
          </div>
          <p className="text-xl font-bold text-slate-800 font-mono">
            {metadata.width}×{metadata.height}
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">Dimensions</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Sampled
          </div>
          <p className="text-xl font-bold text-blue-600 font-mono">{sampled_frames.length}</p>
          <p className="text-slate-400 text-[11px] mt-0.5">@ 1.0s interval</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase mb-1">
            <Activity className="w-3.5 h-3.5 text-violet-600" /> Avg SSIM
          </div>
          <p className="text-xl font-bold text-slate-800 font-mono">{summary.average_ssim.toFixed(4)}</p>
          <p className="text-slate-400 text-[11px] mt-0.5">Mean similarity</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase mb-1">
            <Activity className="w-3.5 h-3.5 text-rose-600" /> Min SSIM
          </div>
          <p
            className={`text-xl font-bold font-mono ${
              summary.min_ssim < 0.8
                ? 'text-rose-600'
                : summary.min_ssim < 0.94
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}
          >
            {summary.min_ssim.toFixed(4)}
          </p>
          <p className="text-slate-500 text-[11px] mt-0.5 font-mono truncate">
            {summary.most_significant_transition?.range_str || 'Max disparity'}
          </p>
        </div>
      </div>

      {/* Prominent Banner for Detected Transition */}
      {summary.most_significant_transition && (summary.high_change_count > 0 || summary.moderate_change_count > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/90 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950">
                Most Significant Transition Window: {summary.most_significant_transition.range_str}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                SSIM: <strong className="font-mono">{summary.most_significant_transition.ssim_score.toFixed(4)}</strong> • {summary.most_significant_transition.change_level} (Pixel Disparity: {summary.max_pixel_diff})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const idx = transitions.findIndex(
                (t) => t.from_timestamp === summary.most_significant_transition?.from_timestamp
              );
              if (idx !== -1) setSelectedTransitionIdx(idx);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Inspect Transition Heatmap
          </button>
        </div>
      )}

      {/* 3. Representative Sampled Frames Gallery */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-slate-800 text-sm font-bold uppercase tracking-wider">
              Sampled Frames ({sampled_frames.length})
            </h4>
            <p className="text-slate-500 text-xs mt-0.5">Regularly spaced 1.0-second video checkpoints</p>
          </div>
          <span className="text-slate-500 text-xs bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            OpenCV VideoCapture
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sampled_frames.map((f: VideoSampledFrame) => (
            <div
              key={f.frame_index}
              onClick={() =>
                setZoomedImage({
                  src: `data:image/jpeg;base64,${f.preview}`,
                  title: `Frame #${f.frame_index} (${f.timestamp_sec.toFixed(2)}s) — ${f.width}×${f.height}`,
                })
              }
              className="group relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:border-blue-500 hover:shadow-xs transition-all duration-200"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src={`data:image/jpeg;base64,${f.preview}`}
                  alt={`Frame ${f.frame_index}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white drop-shadow" />
              </div>
              <div className="p-2 flex items-center justify-between text-[11px] bg-white border-t border-slate-100">
                <span className="text-slate-800 font-semibold font-mono">{f.timestamp_sec.toFixed(2)}s</span>
                <span className="text-slate-400 font-mono">#{f.frame_index}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Frame-to-Frame Temporal Differences & Heatmap */}
      {transitions.length > 0 && selectedTransition && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-slate-800 text-sm font-bold uppercase tracking-wider">
                Inter-Frame Visual Differences &amp; Heatmaps
              </h4>
              <p className="text-slate-500 text-xs mt-0.5">
                Select a consecutive frame pair to inspect localized structural similarity and pixel disparity
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">Selected Interval:</span>
              <span className="font-mono font-semibold text-slate-900">
                {selectedTransition.from_timestamp.toFixed(2)}s → {selectedTransition.to_timestamp.toFixed(2)}s
              </span>
            </div>
          </div>

          {/* Transition selector chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {transitions.map((t: VideoTransition, idx: number) => {
              const isSelected = idx === selectedTransitionIdx;
              return (
                <button
                  key={t.transition_index}
                  type="button"
                  onClick={() => setSelectedTransitionIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs ring-1 ring-blue-500/20 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono">
                    {t.from_timestamp.toFixed(1)}s → {t.to_timestamp.toFixed(1)}s
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getBadgeClass(
                      t.badge_color
                    )}`}
                  >
                    SSIM {t.ssim_score.toFixed(3)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Transition Comparison Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeClass(
                    selectedTransition.badge_color
                  )}`}
                >
                  {selectedTransition.change_level}
                </span>
                <span className="text-slate-600 text-xs">
                  SSIM: <strong className="text-slate-900 font-mono">{selectedTransition.ssim_score.toFixed(4)}</strong>
                </span>
                <span className="text-slate-600 text-xs">
                  Disparity: <strong className="text-slate-900 font-mono">{selectedTransition.mean_pixel_diff}</strong>
                </span>
              </div>
              <p className="text-slate-600 text-xs font-medium">{selectedTransition.explanation}</p>
            </div>

            {/* Visual 3-panel comparison: Frame A, Frame B, Difference Heatmap */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Frame A */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-xs bg-slate-50">
                  <span className="text-slate-700 font-semibold">
                    Frame A ({selectedTransition.from_timestamp.toFixed(2)}s)
                  </span>
                  <span className="text-slate-400 font-mono">#{selectedTransition.from_frame}</span>
                </div>
                <div className="p-2 aspect-video flex items-center justify-center bg-slate-100">
                  {sampled_frames[selectedTransitionIdx] && (
                    <img
                      src={`data:image/jpeg;base64,${sampled_frames[selectedTransitionIdx].preview}`}
                      alt="Frame A"
                      className="w-full h-full object-contain cursor-zoom-in rounded bg-white"
                      onClick={() =>
                        setZoomedImage({
                          src: `data:image/jpeg;base64,${sampled_frames[selectedTransitionIdx].preview}`,
                          title: `Frame A (${selectedTransition.from_timestamp.toFixed(2)}s)`,
                        })
                      }
                    />
                  )}
                </div>
              </div>

              {/* Frame B */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-xs bg-slate-50">
                  <span className="text-slate-700 font-semibold">
                    Frame B ({selectedTransition.to_timestamp.toFixed(2)}s)
                  </span>
                  <span className="text-slate-400 font-mono">#{selectedTransition.to_frame}</span>
                </div>
                <div className="p-2 aspect-video flex items-center justify-center bg-slate-100">
                  {sampled_frames[selectedTransitionIdx + 1] && (
                    <img
                      src={`data:image/jpeg;base64,${sampled_frames[selectedTransitionIdx + 1].preview}`}
                      alt="Frame B"
                      className="w-full h-full object-contain cursor-zoom-in rounded bg-white"
                      onClick={() =>
                        setZoomedImage({
                          src: `data:image/jpeg;base64,${sampled_frames[selectedTransitionIdx + 1].preview}`,
                          title: `Frame B (${selectedTransition.to_timestamp.toFixed(2)}s)`,
                        })
                      }
                    />
                  )}
                </div>
              </div>

              {/* Difference Heatmap */}
              <div className="rounded-xl border border-blue-200 overflow-hidden bg-white shadow-2xs">
                <div className="px-3 py-2 border-b border-blue-100 flex items-center justify-between text-xs bg-blue-50/50">
                  <span className="text-blue-900 font-semibold">Difference Heatmap</span>
                  <span className="text-blue-600 text-[11px]">Blue=Match, Red=Diff</span>
                </div>
                <div className="p-2 aspect-video flex items-center justify-center bg-slate-100">
                  <img
                    src={`data:image/jpeg;base64,${selectedTransition.diff_heatmap}`}
                    alt="Difference Heatmap"
                    className="w-full h-full object-contain cursor-zoom-in rounded bg-white"
                    onClick={() =>
                      setZoomedImage({
                        src: `data:image/jpeg;base64,${selectedTransition.diff_heatmap}`,
                        title: `Difference Heatmap (${selectedTransition.from_timestamp.toFixed(
                          2
                        )}s → ${selectedTransition.to_timestamp.toFixed(2)}s)`,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Academic Observations & Forensic Disclaimer */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
        <h4 className="text-slate-800 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Academic Video Processing Findings
        </h4>

        <ul className="space-y-2">
          {summary.observations.map((obs: string, i: number) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span>{obs}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/80 text-amber-900 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>{summary.disclaimer}</p>
        </div>
      </div>

      {/* Modal Zoom View */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full bg-white p-4 rounded-2xl shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <h4 className="text-slate-900 font-bold text-sm">{zoomedImage.title}</h4>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" /> Close Preview
              </button>
            </div>
            <div className="max-h-[80vh] flex items-center justify-center overflow-auto bg-slate-50 rounded-xl p-2">
              <img
                src={zoomedImage.src}
                alt={zoomedImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
