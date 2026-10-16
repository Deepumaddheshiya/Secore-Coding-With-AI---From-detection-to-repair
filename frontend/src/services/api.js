const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // System
  getHealth: () => fetch(`${API_BASE}/system/health`).then(handleResponse),
  getOllamaStatus: () => fetch(`${API_BASE}/system/ollama-status`).then(handleResponse),
  getAuditLogs: () => fetch(`${API_BASE}/system/audit-logs`).then(handleResponse),

  // Dataset
  getDatasetSummary: () => fetch(`${API_BASE}/dataset/summary`).then(handleResponse),
  getDatasetFiles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/dataset/files?${query}`).then(handleResponse);
  },
  getFileContent: (fileId) => fetch(`${API_BASE}/dataset/files/${fileId}`).then(handleResponse),
  ingestDataset: (targetDirectory) => fetch(`${API_BASE}/dataset/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_directory: targetDirectory })
  }).then(handleResponse),

  // Scanners
  getScannerStatus: () => fetch(`${API_BASE}/scanners/status`).then(handleResponse),
  getScannerRuns: () => fetch(`${API_BASE}/scanners/runs`).then(handleResponse),
  runScan: (scannerName, targetPath = null, fileIds = null) => fetch(`${API_BASE}/scanners/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      scanner_name: scannerName, 
      target_path: typeof targetPath === 'string' ? targetPath : null,
      file_ids: Array.isArray(fileIds) ? fileIds : (Array.isArray(targetPath) ? targetPath : null)
    })
  }).then(handleResponse),
  getScannerReportUrl: (runId) => `${API_BASE}/scanners/runs/${runId}/report`,

  // Findings
  getFindings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/findings?${query}`).then(handleResponse);
  },
  getFindingDetail: (id) => fetch(`${API_BASE}/findings/${id}`).then(handleResponse),
  reviewFinding: (id, reviewData) => fetch(`${API_BASE}/findings/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData)
  }).then(handleResponse),
  getCWEDistribution: () => fetch(`${API_BASE}/findings/analytics/cwe-distribution`).then(handleResponse),
  getLanguageStatistics: () => fetch(`${API_BASE}/findings/analytics/language-statistics`).then(handleResponse),

  // Repair
  generateRepair: (findingId, engineType = 'rule_based', modelName = null) => fetch(`${API_BASE}/repair/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ finding_id: findingId, engine_type: engineType, model_name: modelName })
  }).then(handleResponse),
  getPatches: () => fetch(`${API_BASE}/repair/patches`).then(handleResponse),
  getPatchDetail: (id) => fetch(`${API_BASE}/repair/patches/${id}`).then(handleResponse),
  applyPatch: (patchId) => fetch(`${API_BASE}/repair/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patch_id: patchId, action: 'approve' })
  }).then(handleResponse),
  rollbackPatch: (patchId) => fetch(`${API_BASE}/repair/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patch_id: patchId, action: 'rollback' })
  }).then(handleResponse),

  // Benchmarks
  getBenchmarkTables: () => fetch(`${API_BASE}/benchmarks/tables`).then(handleResponse),
  getBenchmarkTable: (num) => fetch(`${API_BASE}/benchmarks/tables/${num}`).then(handleResponse),
  getBenchmarkRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/benchmarks/records?${query}`).then(handleResponse);
  },

  // Evaluation
  getLocalMetrics: () => fetch(`${API_BASE}/evaluation/local-metrics`).then(handleResponse),
  getPaperVsLocal: () => fetch(`${API_BASE}/evaluation/paper-vs-local`).then(handleResponse),
  generateReports: () => fetch(`${API_BASE}/evaluation/generate-reports`, { method: 'POST' }).then(handleResponse),
};
