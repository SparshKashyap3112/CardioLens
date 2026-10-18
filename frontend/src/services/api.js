import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

/**
 * Health check to verify server status and model readiness.
 */
export async function getHealthStatus() {
  const response = await api.get('/health');
  return response.data;
}

/**
 * Fetch public model information and constraints.
 */
export async function getModelInfo() {
  const response = await api.get('/model-info');
  return response.data;
}

/**
 * Upload an audio file for PCG heart sound inference.
 */
export async function predictAudio(file, onUploadProgress) {
  const formData = new FormData();
  formData.append('audio', file);

  const response = await api.post('/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percent);
      }
    },
  });

  return response.data;
}

/**
 * Fetch list of curated demo audio samples.
 */
export async function getSampleAudios() {
  const response = await api.get('/sample-audio');
  return response.data.samples || [];
}

/**
 * Get streaming audio URL for a sample.
 */
export function getSampleStreamUrl(sampleId) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api';
  return `${base}/sample-audio/${sampleId}`;
}

/**
 * Download a clinical PDF report for the current analysis.
 */
export async function downloadReportPdf(analysisData) {
  const response = await api.post('/generate-report', analysisData, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const analysisId = analysisData.analysis_id || 'Report';
  link.setAttribute('download', `CardioLens_Report_${analysisId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default api;
