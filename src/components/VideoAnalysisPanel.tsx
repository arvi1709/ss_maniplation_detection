import { useState } from 'react';
import {
  Video,
  Clock,
  Film,
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
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'medium':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'low':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      default:
        return 'bg-slate-700/50 border-slate-600 text-slate-300';
    }
  };

  const getBadgeClass = (badge: 'green' | 'amber' | 'red') => {
    switch (badge) {
      case 'red':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'green':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Overall Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            Video Analysis Results
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Temporal frame difference and structural similarity evaluation
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
            summary.status_level
          )}`}
        >
          {summary.overall_status}
        </span>
      </div>

      {/* 2. Video Metadata & Aggregate Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase mb-1">
            <Clock className="w-3.5 h-3.5" /> Duration
          </div>
          <p className="text-lg font-bold text-white">{metadata.duration}s</p>
          <p className="text-slate-500 text-xs mt-0.5">{metadata.file_size_mb} MB</p>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase mb-1">
            <Film className="w-3.5 h-3.5" /> Framerate
          </div>
          <p className="text-lg font-bold text-white">{metadata.fps} FPS</p>
          <p className="text-slate-500 text-xs mt-0.5">{metadata.total_frames} frames</p>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase mb-1">
            <Maximize2 className="w-3.5 h-3.5" /> Resolution
          </div>
          <p className="text-lg font-bold text-white">
            {metadata.width}×{metadata.height}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">Dimensions</p>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase mb-1">
            <Layers className="w-3.5 h-3.5" /> Sampled Frames
          </div>
          <p className="text-lg font-bold text-blue-400">{sampled_frames.length}</p>
          <p className="text-slate-500 text-xs mt-0.5">@ 1.0s interval</p>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase mb-1">
            <Activity className="w-3.5 h-3.5" /> Avg SSIM
          </div>
          <p className="text-lg font-bold text-white">{summary.average_ssim.toFixed(4)}</p>
          <p className="text-slate-500 text-xs mt-0.5">Structural match</p>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase mb-1">
            <Activity className="w-3.5 h-3.5" /> Min SSIM
          </div>
          <p
            className={`text-lg font-bold ${
              summary.min_ssim < 0.8
                ? 'text-red-400'
                : summary.min_ssim < 0.94
                ? 'text-amber-400'
                : 'text-green-400'
            }`}
          >
            {summary.min_ssim.toFixed(4)}
          </p>
          <p className="text-slate-400 text-xs mt-0.5 font-mono truncate">
            {summary.most_significant_transition?.range_str || 'Max disparity'}
          </p>
        </div>
      </div>

      {/* Prominent Banner for Detected Transition */}
      {summary.most_significant_transition && (summary.high_change_count > 0 || summary.moderate_change_count > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-white">
                Most Significant Transition: {summary.most_significant_transition.range_str}
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                SSIM: {summary.most_significant_transition.ssim_score.toFixed(4)} • {summary.most_significant_transition.change_level} (Disparity: {summary.max_pixel_diff})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const idx = transitions.findIndex(
                (t) => t.from_timestamp === summary.most_significant_transition?.from_timestamp
              );
              if (idx !== -1) setSelectedTransitionIdx(idx);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium border border-amber-500/30 transition-colors shrink-0"
          >
            Inspect Transition Heatmap
          </button>
        </div>
      )}

      {/* 3. Representative Sampled Frames Gallery */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-slate-300 text-sm font-medium uppercase tracking-widest">
            Extracted Sampled Frames ({sampled_frames.length})
          </h4>
          <span className="text-slate-500 text-xs">Sampled once per second</span>
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
              className="group relative rounded-lg border border-slate-700/60 bg-slate-950 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all duration-200"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                <img
                  src={`data:image/jpeg;base64,${f.preview}`}
                  alt={`Frame ${f.frame_index}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white drop-shadow" />
              </div>
              <div className="p-2 flex items-center justify-between text-[11px] bg-slate-900/90 border-t border-slate-800">
                <span className="text-slate-300 font-semibold">{f.timestamp_sec.toFixed(2)}s</span>
                <span className="text-slate-500">#{f.frame_index}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Frame-to-Frame Temporal Differences & Heatmap */}
      {transitions.length > 0 && selectedTransition && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-slate-300 text-sm font-medium uppercase tracking-widest">
                Inter-Frame Visual Differences & Heatmaps
              </h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Select a transition pair to inspect structural similarity and pixel disparity
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Selected Transition:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-medium">
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
                  onClick={() => setSelectedTransitionIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <span>
                    {t.from_timestamp.toFixed(1)}s → {t.to_timestamp.toFixed(1)}s
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getBadgeClass(
                      t.badge_color
                    )}`}
                  >
                    {t.ssim_score.toFixed(3)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Transition Comparison Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeClass(
                    selectedTransition.badge_color
                  )}`}
                >
                  {selectedTransition.change_level}
                </span>
                <span className="text-slate-300 text-xs">
                  SSIM: <strong className="text-white">{selectedTransition.ssim_score.toFixed(4)}</strong>
                </span>
                <span className="text-slate-300 text-xs">
                  Mean Disparity: <strong className="text-white">{selectedTransition.mean_pixel_diff}</strong>
                </span>
              </div>
              <p className="text-slate-400 text-xs">{selectedTransition.explanation}</p>
            </div>

            {/* Visual 3-panel comparison: Frame A, Frame B, Difference Heatmap */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Frame A */}
              <div className="rounded-lg border border-slate-700/60 overflow-hidden bg-slate-900">
                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    Frame A ({selectedTransition.from_timestamp.toFixed(2)}s)
                  </span>
                  <span className="text-slate-500">#{selectedTransition.from_frame}</span>
                </div>
                <div className="p-2 aspect-video flex items-center justify-center bg-slate-950">
                  {sampled_frames[selectedTransitionIdx] && (
                    <img
                      src={`data:image/jpeg;base64,${sampled_frames[selectedTransitionIdx].preview}`}
                      alt="Frame A"
                      className="w-full h-full object-contain cursor-zoom-in rounded"
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
              <div className="rounded-lg border border-slate-700/60 overflow-hidden bg-slate-900">
                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    Frame B ({selectedTransition.to_timestamp.toFixed(2)}s)
                  </span>
                  <span className="text-slate-500">#{selectedTransition.to_frame}</span>
                </div>
                <div className="p-2 aspect-video flex items-center justify-center bg-slate-950">
                  {sampled_frames[selectedTransitionIdx + 1] && (
                    <img
                      src={`data:image/jpeg;base64,${sampled_frames[selectedTransitionIdx + 1].preview}`}
                      alt="Frame B"
                      className="w-full h-full object-contain cursor-zoom-in rounded"
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
              <div className="rounded-lg border border-blue-500/30 overflow-hidden bg-blue-500/5">
                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-blue-300 font-medium">Difference Heatmap</span>
                  <span className="text-slate-500">Blue=Match, Red=Diff</span>
                </div>
                <div className="p-2 aspect-video flex items-center justify-center bg-slate-950">
                  <img
                    src={`data:image/jpeg;base64,${selectedTransition.diff_heatmap}`}
                    alt="Difference Heatmap"
                    className="w-full h-full object-contain cursor-zoom-in rounded"
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
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 space-y-4">
        <h4 className="text-slate-300 text-sm font-medium uppercase tracking-widest flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          Academic Video Processing Findings
        </h4>

        <ul className="space-y-2">
          {summary.observations.map((obs: string, i: number) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <span>{obs}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300/90 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>{summary.disclaimer}</p>
        </div>
      </div>

      {/* Modal Zoom View */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 flex items-center gap-2 text-slate-300 hover:text-white text-sm"
            >
              <ZoomOut className="w-4 h-4" /> Close
            </button>
            <img
              src={zoomedImage.src}
              alt={zoomedImage.title}
              className="max-w-full max-h-screen object-contain rounded-xl"
            />
            <p className="text-center text-slate-400 text-sm mt-3">{zoomedImage.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
