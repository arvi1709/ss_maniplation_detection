import { AnalysisResult } from '../types';

const API_BASE = 'http://localhost:5000/api';

export async function analyzeSingleImage(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || 'Analysis failed');
  }

  return response.json();
}

export async function compareImages(original: File, suspected: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('original', original);
  formData.append('suspected', suspected);

  const response = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || 'Comparison failed');
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}
