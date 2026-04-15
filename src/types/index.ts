export type AnalysisMode = 'single' | 'compare';

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
}

export interface UploadedFiles {
  original: File | null;
  suspected: File | null;
}
