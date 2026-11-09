export type AnalysisMode = 'single' | 'compare' | 'video';

export interface OcrData {
  full_text: string;
  numbers_found: string[];
  currency_amounts: string[];
  text_anomalies: string[];
}

export interface AnalysisResult {
  mode: AnalysisMode;
  ela_image: string;
  highlighted_image: string;
  extracted_text: string;
  currency_amounts: string[];
  numbers_found: string[];
  confidence_score: number;
  verdict: string;
  findings: string[];
  ela_intensity: number;
  noise_score: number;
  suspicious_regions: number;
  report: string;
  original_image?: string;
  suspected_image?: string;
  diff_heatmap?: string;
  ssim_score?: number;
  alignment_info?: {
    status: string;
    method?: string;
    description?: string;
    aligned?: boolean;
    aspect_diff?: number;
  };
}

export interface VideoMetadata {
  filename: string;
  duration: number;
  fps: number;
  total_frames: number;
  width: number;
  height: number;
  file_size_mb: number;
}

export interface VideoSampledFrame {
  frame_index: number;
  timestamp_sec: number;
  width: number;
  height: number;
  preview: string;
}

export interface VideoTransition {
  transition_index: number;
  from_frame: number;
  to_frame: number;
  from_timestamp: number;
  to_timestamp: number;
  ssim_score: number;
  mean_pixel_diff: number;
  change_level: string;
  level_code: 'low' | 'medium' | 'high';
  badge_color: 'green' | 'amber' | 'red';
  explanation: string;
  diff_heatmap: string;
}

export interface MostSignificantTransition {
  from_timestamp: number;
  to_timestamp: number;
  range_str: string;
  ssim_score: number;
  change_level: string;
  level_code: 'low' | 'medium' | 'high';
}

export interface VideoSummary {
  overall_status: string;
  status_level: 'low' | 'medium' | 'high' | 'neutral';
  average_ssim: number;
  min_ssim: number;
  max_pixel_diff: number;
  low_change_count: number;
  moderate_change_count: number;
  high_change_count: number;
  most_significant_transition?: MostSignificantTransition;
  observations: string[];
  disclaimer: string;
}

export interface VideoAnalysisResult {
  mode: 'video';
  metadata: VideoMetadata;
  sampled_frames: VideoSampledFrame[];
  transitions: VideoTransition[];
  summary: VideoSummary;
}

export interface UploadedFiles {
  original: File | null;
  suspected: File | null;
}
