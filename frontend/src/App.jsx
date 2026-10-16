import React, { useState, useEffect } from 'react';
import { 
  Shield, Database, Terminal, AlertTriangle, Bug, Code2, 
  Cpu, FileText, CheckCircle2, XCircle, Search, Download, 
  RefreshCw, Play, ArrowRight, Layers, FileCode, Check, 
  HelpCircle, Settings as SettingsIcon, Activity, ChevronRight,
  TrendingUp, BarChart3, AlertOctagon, Undo, Sliders, ExternalLink
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, Legend 
} from 'recharts';
import { api } from './services/api';

const COLORS = ['#00f0ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [datasetSummary, setDatasetSummary] = useState(null);
  const [files, setFiles] = useState([]);
  const [scanners, setScanners] = useState([]);
  const [findings, setFindings] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [patches, setPatches] = useState([]);
  const [selectedPatch, setSelectedPatch] = useState(null);
  const [cweData, setCweData] = useState([]);
  const [langStats, setLangStats] = useState([]);
  const [paperTables, setPaperTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [benchmarkRecords, setBenchmarkRecords] = useState([]);
  const [paperVsLocal, setPaperVsLocal] = useState([]);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Filters & State
  const [tableSearch, setTableSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [findingSeverityFilter, setFindingSeverityFilter] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState('confirmed_vulnerability');
  const [notification, setNotification] = useState(null);
  const [repairEngineMode, setRepairEngineMode] = useState('rule_based');
  const [selectedOllamaModel, setSelectedOllamaModel] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [fileLangFilter, setFileLangFilter] = useState('ALL');

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [h, summary, sc, tables, ollama] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getDatasetSummary().catch(() => null),
        api.getScannerStatus().catch(() => []),
        api.getBenchmarkTables().catch(() => []),
        api.getOllamaStatus().catch(() => null)
      ]);
      setHealth(h);
      setDatasetSummary(summary);
      setScanners(sc);
      setPaperTables(tables);
      setOllamaStatus(ollama);
      if (ollama?.available_models?.length) {
        setSelectedOllamaModel(ollama.available_models[0]);
      }
      refreshFindings();
      refreshFiles();
      refreshPatches();
      refreshAnalytics();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refreshFindings = async () => {
    try {
      const f = await api.getFindings();
      setFindings(f);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshFiles = async () => {
    try {
      const fl = await api.getDatasetFiles({ limit: 200 });
      setFiles(fl);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshPatches = async () => {
    try {
      const p = await api.getPatches();
      setPatches(p);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAnalytics = async () => {
    try {
      const [cwe, langs, comp, logs] = await Promise.all([
        api.getCWEDistribution().catch(() => []),
        api.getLanguageStatistics().catch(() => []),
        api.getPaperVsLocal().catch(() => []),
        api.getAuditLogs().catch(() => [])
      ]);
      setCweData(cwe);
      setLangStats(langs);
      setPaperVsLocal(comp);
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunScan = async (scannerName, targetPath = null, fileIds = null) => {
    setLoading(true);
    try {
      const res = await api.runScan(scannerName, targetPath, fileIds);
      notify(`Scan completed with ${scannerName}. Detections added: ${res.new_findings_added}`);
      await refreshFindings();
      await refreshAnalytics();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSelectedFiles = async (scannerName = 'Flawfinder') => {
    if (selectedFileIds.length === 0) {
      notify('Please manually select at least one C, C++, or C# file first.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.runScan(scannerName, null, selectedFileIds);
      notify(`Scanned ${selectedFileIds.length} selected files with ${scannerName}. New findings: ${res.new_findings_added}`);
      await refreshFindings();
      await refreshAnalytics();
      setActiveTab('findings');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAskAIToRepair = async (finding) => {
    setSelectedFinding(finding);
    setLoading(true);
    try {
      const engine = repairEngineMode === 'ollama_local' && ollamaStatus?.service_online ? 'ollama' : 'rule_based';
      const patch = await api.generateRepair(finding.id, engine, selectedOllamaModel || null);
      setSelectedPatch(patch);
      notify(`AI generated repair patch #${patch.patch_id || patch.id} for ${finding.cwe_id || 'vulnerability'}`);
      await refreshPatches();
      setActiveTab('patch_review');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIngestDataset = async () => {
    setLoading(true);
    try {
      const res = await api.ingestDataset();
      notify(`Dataset processed successfully! Added: ${res.files_added} files.`);
      const summary = await api.getDatasetSummary();
      setDatasetSummary(summary);
      await refreshFiles();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewFinding = async (findingId) => {
    try {
      await api.reviewFinding(findingId, {
        finding_id: findingId,
        status: reviewStatus,
        reviewer_notes: reviewNotes
      });
      notify(`Finding #${findingId} marked as ${reviewStatus}`);
      await refreshFindings();
      if (selectedFinding?.id === findingId) {
        setSelectedFinding({ ...selectedFinding, review_status: reviewStatus });
      }
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleGenerateRepair = async (findingId) => {
    setLoading(true);
    try {
      const res = await api.generateRepair(findingId, repairEngineMode, selectedOllamaModel);
      notify(`Repair generated using ${res.engine_used}! Patch #${res.patch_id} ready for preview.`);
      await refreshPatches();
      const p = await api.getPatchDetail(res.patch_id);
      setSelectedPatch(p);
      setActiveTab('patch_review');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPatch = async (patchId) => {
    setLoading(true);
    try {
      const res = await api.applyPatch(patchId);
      notify(`Patch #${patchId} applied! Backup saved at ${res.backup_path}. Rescan passed: ${res.rescan_passed}`);
      await refreshPatches();
      await refreshFindings();
      if (selectedPatch?.id === patchId) {
        setSelectedPatch({ ...selectedPatch, status: 'applied', rescan_passed: res.rescan_passed, rescan_details: res.rescan_details });
      }
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRollbackPatch = async (patchId) => {
    setLoading(true);
    try {
      await api.rollbackPatch(patchId);
      notify(`Patch #${patchId} rolled back successfully to original backup!`);
      await refreshPatches();
      await refreshFindings();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReports = async () => {
    setLoading(true);
    try {
      const res = await api.generateReports();
      notify(`Generated 6 CSV reports and final evaluation Markdown report in reports/`);
      await refreshAnalytics();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBenchmarkRecords = async (tableNum) => {
    setLoading(true);
    try {
      const res = await api.getBenchmarkRecords({ table_number: tableNum, page_size: 100 });
      setBenchmarkRecords(res.records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: '1. Overview Dashboard', icon: Shield },
    { id: 'paper_benchmarks', label: '2. Research Paper Benchmarks', icon: FileText },
    { id: 'benchmark_explorer', label: '3. Complete Benchmark Explorer', icon: Layers },
    { id: 'dataset_mgmt', label: '4. Dataset Management', icon: Database },
    { id: 'dataset_inventory', label: '5. Dataset Inventory', icon: FileCode },
    { id: 'scanner_mgmt', label: '6. Scanner Management', icon: Terminal },
    { id: 'findings', label: '7. Security Findings', icon: AlertTriangle },
    { id: 'vulnerability_details', label: '8. Vulnerability Details', icon: Bug },
    { id: 'cwe_analysis', label: '9. CWE Analysis', icon: AlertOctagon },
    { id: 'lang_analysis', label: '10. Language-wise Analysis', icon: Code2 },
    { id: 'snapshot_analysis', label: '11. Snapshot-wise Analysis', icon: RefreshCw },
    { id: 'repair_suggestions', label: '12. Repair Suggestions', icon: Sliders },
    { id: 'patch_review', label: '13. Patch Review & Approval', icon: CheckCircle2 },
    { id: 'before_after', label: '14. Before/After Rescan', icon: Activity },
    { id: 'local_model', label: '15. Local Model Setup', icon: Cpu },
    { id: 'evaluation_results', label: '16. Evaluation Results', icon: TrendingUp },
    { id: 'paper_vs_local', label: '17. Paper vs Local Comparison', icon: BarChart3 },
    { id: 'reports', label: '18. Reports & Exports', icon: Download },
    { id: 'settings', label: '19. Project Settings', icon: SettingsIcon },
    { id: 'health_logs', label: '20. System Health & Logs', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-[#0b0f19] text-gray-200 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0d1424] border-r border-[#1f293d] flex flex-col justify-between shrink-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[#1f293d] flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white uppercase">SecureCode AI</h1>
              <p className="text-[11px] text-gray-400">Detection to Repair Engine</p>
            </div>
          </div>

          {/* Strict compliance badge */}
          <div className="mx-3 my-2 p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Strict Offline Mode: No Cloud AI / No API Keys</span>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-400 font-semibold' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#131b2e]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-[#1f293d] text-[11px] text-gray-400 bg-[#090d17]">
            <p className="font-semibold text-gray-300">Empirical SE (2026) 31:93</p>
            <p className="truncate text-[10px]">DOI: 10.1007/s10664-026-10812-8</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0f19]">
        {/* TOP STATUS BAR */}
        <header className="h-14 border-b border-[#1f293d] bg-[#0e1628]/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{menuItems.find(m => m.id === activeTab)?.label}</span>
            </span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-400">
              Files: <strong className="text-white">{datasetSummary?.total_files || 0}</strong>
            </span>
            <span className="text-xs text-gray-400">
              Detections: <strong className="text-white">{findings.length}</strong>
            </span>
            <span className="text-xs text-gray-400">
              Patches: <strong className="text-white">{patches.length}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {ollamaStatus?.service_online ? (
              <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1">
                <Cpu className="w-3 h-3" />
                <span>Ollama Online ({ollamaStatus.available_models?.[0] || 'active'})</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center space-x-1">
                <Cpu className="w-3 h-3" />
                <span>Deterministic Rule Repair Mode</span>
              </span>
            )}

            <button
              onClick={loadInitialData}
              disabled={loading}
              className="p-1.5 rounded bg-[#162036] hover:bg-[#1e2c4a] text-gray-300 border border-[#253352] transition"
              title="Refresh all data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className={`mx-6 mt-3 px-4 py-2.5 rounded border text-xs flex items-center justify-between shadow-lg transition-all ${
            notification.type === 'error' 
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' 
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
          }`}>
            <span>{notification.msg}</span>
            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white ml-3">✕</button>
          </div>
        )}

        {/* ROUTED CONTENT VIEW */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Paper vs Local Distinction Notice */}
              <div className="p-4 rounded-lg bg-[#11192e] border border-cyan-500/30 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>Empirical Study Replication: "Secure coding with AI – from detection to repair"</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 max-w-4xl">
                      Replicating empirical evaluation of C-family source files from the DevGPT dataset using multi-scanner static analysis (Flawfinder, Semgrep, Cppcheck, Snyk) and local vulnerability mitigation. Cloud AI models reported in the research paper are benchmarked in historical tabular sections.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('paper_vs_local')}
                    className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-medium transition flex items-center space-x-1"
                  >
                    <span>Compare Paper vs Local</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* FINAL PROJECT ARCHITECTURE WORKFLOW STEPPER */}
              <div className="p-5 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1f293d] pb-2">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Authoritative Final Project Architecture & Workflow
                    </h3>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-medium">7-Stage Pipeline</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
                  {/* Step 1 */}
                  <div 
                    onClick={() => setActiveTab('dataset_mgmt')}
                    className="p-3 rounded bg-[#0d1424] border border-[#1f293d] hover:border-cyan-500/50 cursor-pointer transition text-left flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">Stage 1</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">DevGPT Dataset</h4>
                      <p className="text-[10px] text-gray-400 mt-1">20231012 & 20240514 Snapshots</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-2 font-mono">10 Active Files</span>
                  </div>

                  {/* Step 2 */}
                  <div 
                    onClick={() => setActiveTab('dataset_inventory')}
                    className="p-3 rounded bg-[#0d1424] border border-[#1f293d] hover:border-cyan-500/50 cursor-pointer transition text-left flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">Stage 2</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Select Files</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Manual C, C++, C# Selection</p>
                    </div>
                    <span className="text-[10px] text-cyan-300 mt-2 font-mono">352 Code LOC</span>
                  </div>

                  {/* Step 3 */}
                  <div 
                    onClick={() => setActiveTab('scanner_mgmt')}
                    className="p-3 rounded bg-[#0d1424] border border-[#1f293d] hover:border-cyan-500/50 cursor-pointer transition text-left flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">Stage 3</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Analyze Code</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Snyk, Semgrep, Flawfinder, Cppcheck</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-2 font-mono">Flawfinder v2.0.20</span>
                  </div>

                  {/* Step 4 */}
                  <div 
                    onClick={() => setActiveTab('findings')}
                    className="p-3 rounded bg-[#0d1424] border border-[#1f293d] hover:border-cyan-500/50 cursor-pointer transition text-left flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">Stage 4</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Process Reports</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Python Normalization & CWE Mapping</p>
                    </div>
                    <span className="text-[10px] text-amber-400 mt-2 font-mono">{findings.length} Findings</span>
                  </div>

                  {/* Step 5 */}
                  <div 
                    onClick={() => setActiveTab('repair_suggestions')}
                    className="p-3 rounded bg-[#0d1424] border border-[#1f293d] hover:border-cyan-500/50 cursor-pointer transition text-left flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">Stage 5</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">AI Tools</h4>
                      <p className="text-[10px] text-gray-400 mt-1">GPT/Claude (Paper) & Ollama (Local)</p>
                    </div>
                    <span className="text-[10px] text-purple-400 mt-2 font-mono">No API Keys</span>
                  </div>

                  {/* Step 6 */}
                  <div 
                    onClick={() => setActiveTab('patch_review')}
                    className="p-3 rounded bg-[#0d1424] border border-[#1f293d] hover:border-cyan-500/50 cursor-pointer transition text-left flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">Stage 6</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Identify & Repair</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Generate Diffs, Approve, Safe Copy</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-2 font-mono">{patches.length} Patches</span>
                  </div>

                  {/* Step 7 */}
                  <div 
                    onClick={() => setActiveTab('evaluation_results')}
                    className="p-3 rounded bg-[#0d1424] border border-[#1f293d] hover:border-cyan-500/50 cursor-pointer transition text-left flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">Stage 7</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Calculate Performance</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Detection & Repair Success Metrics</p>
                    </div>
                    <span className="text-[10px] text-cyan-400 mt-2 font-mono">100% Fix Rate</span>
                  </div>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Dataset Files Ingested</p>
                  <p className="text-2xl font-bold text-white mt-1">{datasetSummary?.total_files || 0}</p>
                  <p className="text-[11px] text-cyan-400 mt-1">{datasetSummary?.total_loc || 0} Lines of Code</p>
                </div>

                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Local Security Findings</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{findings.length}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Across {Object.keys(datasetSummary?.files_by_language || {}).length} languages
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Repairs Generated</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{patches.length}</p>
                  <p className="text-[11px] text-emerald-400/80 mt-1">
                    {patches.filter(p => p.rescan_passed).length} Verified (Rescan Passed)
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Paper Tables Documented</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">{paperTables.length} / 18</p>
                  <p className="text-[11px] text-gray-400 mt-1">100% Extracted with Source Citations</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Historical Paper Scanner Detections (Table 6)</span>
                  </h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Flawfinder', detects: 679, errors: 20, warnings: 23, info: 633 },
                        { name: 'Snyk', detects: 153, errors: 1, warnings: 150, info: 2 },
                        { name: 'Cppcheck', detects: 71, errors: 0, warnings: 71, info: 0 },
                        { name: 'Semgrep', detects: 56, errors: 0, warnings: 56, info: 0 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1424', borderColor: '#1f293d', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="errors" fill="#ef4444" name="Errors" />
                        <Bar dataKey="warnings" fill="#f59e0b" name="Warnings" />
                        <Bar dataKey="info" fill="#00f0ff" name="Notes/Info" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Model Fix Rates: Sept 2025 vs Oct 2024 (Table 12)</span>
                  </h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { model: 'GPT-4o (Oct 24)', fixRate: 53.1 },
                        { model: 'GPT-4.1 (Sep 25)', fixRate: 75.0 },
                        { model: 'Claude Opus (Sep 25)', fixRate: 76.8 },
                        { model: 'GPT-5 (Sep 25)', fixRate: 78.6 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                        <XAxis dataKey="model" stroke="#9ca3af" fontSize={11} />
                        <YAxis unit="%" stroke="#9ca3af" fontSize={11} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1424', borderColor: '#1f293d', fontSize: '11px' }} />
                        <Bar dataKey="fixRate" fill="#10b981" name="Repair Fix Rate (%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">Scanner Quick Trigger:</span>
                  <button
                    onClick={() => handleRunScan('Flawfinder')}
                    className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded text-xs transition"
                  >
                    Run Flawfinder
                  </button>
                  <button
                    onClick={() => handleRunScan('all')}
                    className="px-3 py-1 bg-[#1e2a44] hover:bg-[#28385b] text-gray-200 border border-[#334670] rounded text-xs transition"
                  >
                    Run All Available
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGenerateReports}
                    className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-xs transition flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export Evaluation CSVs</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('benchmark_explorer')}
                    className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-xs transition"
                  >
                    Explore All 18 Paper Tables
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. RESEARCH PAPER BENCHMARKS */}
          {activeTab === 'paper_benchmarks' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30">
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                  RESEARCH PAPER REPORTED RESULTS — NOT LOCAL EXECUTION RESULTS
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Historical empirical data extracted verbatim from <em>Empirical Software Engineering (2026) 31:93</em>.
                </p>
              </div>

              {/* Table 6 and Table 7 Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                    Table 6: Raw Scanner Detections (2,315 files)
                  </h4>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#162036] text-gray-300">
                      <tr>
                        <th className="p-2">Scanner</th>
                        <th className="p-2">Errors</th>
                        <th className="p-2">Warnings</th>
                        <th className="p-2">Notes/Info</th>
                        <th className="p-2 font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]">
                      <tr><td className="p-2">Snyk</td><td className="p-2 text-rose-400">1</td><td className="p-2 text-amber-400">150</td><td className="p-2 text-cyan-400">2</td><td className="p-2 font-bold text-white">153</td></tr>
                      <tr><td className="p-2">Semgrep</td><td className="p-2 text-rose-400">0</td><td className="p-2 text-amber-400">56</td><td className="p-2 text-cyan-400">0</td><td className="p-2 font-bold text-white">56</td></tr>
                      <tr><td className="p-2">Flawfinder</td><td className="p-2 text-rose-400">20</td><td className="p-2 text-amber-400">23</td><td className="p-2 text-cyan-400">633</td><td className="p-2 font-bold text-white">679</td></tr>
                      <tr><td className="p-2">Cppcheck</td><td className="p-2 text-rose-400">0</td><td className="p-2 text-amber-400">71</td><td className="p-2 text-cyan-400">0</td><td className="p-2 font-bold text-white">71</td></tr>
                      <tr className="bg-[#15213b] font-bold"><td className="p-2">Total</td><td className="p-2 text-rose-400">21</td><td className="p-2 text-amber-400">300</td><td className="p-2 text-cyan-400">635</td><td className="p-2 text-white">959</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                    Table 7: Detections Per Lines of Code (44,943 LOC)
                  </h4>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#162036] text-gray-300">
                      <tr>
                        <th className="p-2">Scanner</th>
                        <th className="p-2">Files</th>
                        <th className="p-2">LOC</th>
                        <th className="p-2">Detects</th>
                        <th className="p-2">LOC/Detect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]">
                      <tr><td className="p-2">Snyk</td><td className="p-2">2315</td><td className="p-2">44,943</td><td className="p-2">153</td><td className="p-2 text-cyan-300">293.7</td></tr>
                      <tr><td className="p-2">Semgrep</td><td className="p-2">2315</td><td className="p-2">44,943</td><td className="p-2">56</td><td className="p-2 text-cyan-300">802.6</td></tr>
                      <tr><td className="p-2">Flawfinder</td><td className="p-2">1315</td><td className="p-2">27,318</td><td className="p-2">679</td><td className="p-2 text-cyan-300">40.2</td></tr>
                      <tr><td className="p-2">Cppcheck</td><td className="p-2">1315</td><td className="p-2">27,318</td><td className="p-2">71</td><td className="p-2 text-cyan-300">384.8</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 12: LLM Detection & Repair Rates */}
              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                  Table 12: September 2025 Frontier LLM Comparison (56 Confirmed Bugs across 48 Files)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#162036] text-gray-300">
                      <tr>
                        <th className="p-2.5">Model</th>
                        <th className="p-2.5">Detected (20231012)</th>
                        <th className="p-2.5">Detected (20240514)</th>
                        <th className="p-2.5">Total Detected</th>
                        <th className="p-2.5">Detection Rate</th>
                        <th className="p-2.5">Fixed (20231012)</th>
                        <th className="p-2.5">Fixed (20240514)</th>
                        <th className="p-2.5">Total Fixed</th>
                        <th className="p-2.5 font-bold text-emerald-400">Fix Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]">
                      <tr>
                        <td className="p-2.5 font-semibold text-white">GPT-4.1</td>
                        <td className="p-2.5">23 / 28</td>
                        <td className="p-2.5">23 / 28</td>
                        <td className="p-2.5 text-cyan-300 font-bold">46 / 56</td>
                        <td className="p-2.5 text-cyan-300 font-bold">82.14%</td>
                        <td className="p-2.5">21 / 28</td>
                        <td className="p-2.5">21 / 28</td>
                        <td className="p-2.5 text-emerald-400 font-bold">42 / 56</td>
                        <td className="p-2.5 text-emerald-400 font-bold">75.00%</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-white">GPT-5</td>
                        <td className="p-2.5">21 / 28</td>
                        <td className="p-2.5">23 / 28</td>
                        <td className="p-2.5 text-cyan-300 font-bold">44 / 56</td>
                        <td className="p-2.5 text-cyan-300 font-bold">78.57%</td>
                        <td className="p-2.5">22 / 28</td>
                        <td className="p-2.5">22 / 28</td>
                        <td className="p-2.5 text-emerald-400 font-bold">44 / 56</td>
                        <td className="p-2.5 text-emerald-400 font-bold">78.57%</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-white">Claude Opus 4.1</td>
                        <td className="p-2.5">22 / 28</td>
                        <td className="p-2.5">23 / 28</td>
                        <td className="p-2.5 text-cyan-300 font-bold">45 / 56</td>
                        <td className="p-2.5 text-cyan-300 font-bold">80.36%</td>
                        <td className="p-2.5">23 / 28</td>
                        <td className="p-2.5">20 / 28</td>
                        <td className="p-2.5 text-emerald-400 font-bold">43 / 56</td>
                        <td className="p-2.5 text-emerald-400 font-bold">76.79%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 17 vs Table 18: User vs AI Code */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                    Table 17: User-Provided Code (25 Bugs / 23 Files)
                  </h4>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#162036] text-gray-300">
                      <tr><th>Model</th><th>Detected</th><th>Detection %</th><th>Fixed</th><th>Fix %</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]">
                      <tr><td>GPT-4.1</td><td>22 / 25</td><td className="text-cyan-300">88.00%</td><td>22 / 25</td><td className="text-emerald-400">88.00%</td></tr>
                      <tr><td>GPT-5</td><td>21 / 25</td><td className="text-cyan-300">84.00%</td><td>21 / 25</td><td className="text-emerald-400">84.00%</td></tr>
                      <tr><td>Claude Opus 4.1</td><td>19 / 25</td><td className="text-cyan-300">76.00%</td><td>19 / 25</td><td className="text-emerald-400">76.00%</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                    Table 18: GPT-Generated Code (31 Bugs / 25 Files)
                  </h4>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#162036] text-gray-300">
                      <tr><th>Model</th><th>Detected</th><th>Detection %</th><th>Fixed</th><th>Fix %</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]">
                      <tr><td>GPT-4.1</td><td>26 / 31</td><td className="text-cyan-300">83.87%</td><td>23 / 31</td><td className="text-emerald-400">74.19%</td></tr>
                      <tr><td>GPT-5</td><td>23 / 31</td><td className="text-cyan-300">74.19%</td><td>23 / 31</td><td className="text-emerald-400">74.19%</td></tr>
                      <tr><td>Claude Opus 4.1</td><td>26 / 31</td><td className="text-cyan-300">83.87%</td><td>25 / 31</td><td className="text-emerald-400">80.65%</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. COMPLETE BENCHMARK EXPLORER (ALL 18 TABLES) */}
          {activeTab === 'benchmark_explorer' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search tables by title, category, or table number..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="w-full bg-[#0d1424] border border-[#1f293d] rounded pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#0d1424] border border-[#1f293d] rounded px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">All Categories</option>
                    <option value="Quantitative benchmark results">Quantitative benchmarks</option>
                    <option value="Dataset statistics">Dataset statistics</option>
                    <option value="Tool configuration or comparison">Tool configuration</option>
                    <option value="Literature-review comparisons">Literature comparison</option>
                    <option value="Vulnerability classifications">Vulnerability classifications</option>
                    <option value="Experimental results">Experimental results</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href="/api/benchmarks/export-json"
                    download="paper_benchmarks.json"
                    className="px-3 py-1.5 bg-[#162036] hover:bg-[#1e2a44] text-cyan-300 border border-cyan-500/30 rounded text-xs flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </a>
                  <a
                    href="/api/benchmarks/export-csv"
                    download="paper_benchmarks.csv"
                    className="px-3 py-1.5 bg-[#162036] hover:bg-[#1e2a44] text-emerald-300 border border-emerald-500/30 rounded text-xs flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </a>
                </div>
              </div>

              {/* Table List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paperTables
                  .filter(t => !tableSearch || t.title.toLowerCase().includes(tableSearch.toLowerCase()) || String(t.table_number).includes(tableSearch))
                  .filter(t => !selectedCategory || t.category === selectedCategory)
                  .map((t) => (
                    <div 
                      key={t.table_number} 
                      className={`p-4 rounded-lg bg-[#11192e] border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedTable?.table_number === t.table_number 
                          ? 'border-cyan-400 ring-1 ring-cyan-400' 
                          : 'border-[#1f293d] hover:border-gray-600'
                      }`}
                      onClick={async () => {
                        const full = await api.getBenchmarkTable(t.table_number);
                        setSelectedTable(full);
                        loadBenchmarkRecords(t.table_number);
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-bold text-cyan-400">Table {t.table_number}</span>
                          <span className="text-[11px] bg-[#162036] px-2 py-0.5 rounded">Page {t.page}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-1.5 line-clamp-2">{t.title}</h4>
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{t.category}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#1f293d] flex items-center justify-between text-[11px] text-gray-400">
                        <span>{t.row_count} rows extracted</span>
                        <span className="text-cyan-400 flex items-center space-x-0.5 font-medium">
                          <span>View table</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Table Modal / Drawer Details */}
              {selectedTable && (
                <div className="p-5 rounded-lg bg-[#0e1628] border border-cyan-500/40 shadow-xl space-y-4">
                  <div className="flex items-start justify-between border-b border-[#1f293d] pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-xs">
                          Table {selectedTable.table_number}
                        </span>
                        <span className="text-xs text-gray-400">Page {selectedTable.page} in Paper</span>
                        <span className="text-xs text-amber-400">({selectedTable.category})</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{selectedTable.title}</h3>
                      {selectedTable.notes && (
                        <p className="text-xs text-gray-400 mt-1"><em>Notes:</em> {selectedTable.notes}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedTable(null)} 
                      className="px-2.5 py-1 text-xs bg-[#1a253d] hover:bg-[#253557] rounded text-gray-300"
                    >
                      Close Table
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#141f36] text-gray-300 sticky top-0">
                        <tr>
                          {selectedTable.columns?.map((c, i) => (
                            <th key={i} className="p-2 border-b border-[#253352] whitespace-nowrap">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a253d]">
                        {selectedTable.rows?.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#121c33]">
                            {selectedTable.columns?.map((c, cIdx) => (
                              <td key={cIdx} className="p-2 text-gray-200 whitespace-nowrap">
                                {typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c] ?? '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. DATASET MANAGEMENT */}
          {activeTab === 'dataset_mgmt' && (
            <div className="space-y-6">
              <div className="p-5 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>DevGPT Dataset Ingestion & Configuration</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Target directory: <code className="text-cyan-300 bg-[#0d1424] px-2 py-0.5 rounded">data/devgpt/</code>. 
                  Supports C, C++, and C# files with recursive walk, LOC counting, snapshot origin detection, and deduplication.
                </p>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={handleIngestDataset}
                    disabled={loading}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded text-xs transition flex items-center space-x-2 shadow-md shadow-cyan-600/20"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Scan & Ingest Dataset Directory</span>
                  </button>
                  <span className="text-xs text-gray-400">
                    Currently managing {datasetSummary?.total_files || 0} files.
                  </span>
                </div>
              </div>

              {/* Snapshot Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h4 className="text-xs font-bold text-gray-300 mb-2 uppercase">Files by Snapshot</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded bg-[#0d1424]">
                      <span>snapshot_20231012 (Oct 2023)</span>
                      <strong className="text-cyan-400">{datasetSummary?.files_by_snapshot?.snapshot_20231012 || 0} files</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#0d1424]">
                      <span>snapshot_20240514 (May 2024)</span>
                      <strong className="text-cyan-400">{datasetSummary?.files_by_snapshot?.snapshot_20240514 || 0} files</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h4 className="text-xs font-bold text-gray-300 mb-2 uppercase">Lines of Code by Language</h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(datasetSummary?.lines_by_language || {}).map(([lang, lines]) => (
                      <div key={lang} className="flex justify-between p-2 rounded bg-[#0d1424]">
                        <span className="uppercase">{lang}</span>
                        <strong className="text-emerald-400">{lines} LOC</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. DATASET INVENTORY */}
          {activeTab === 'dataset_inventory' && (() => {
            const filteredFiles = files.filter(f => fileLangFilter === 'ALL' || f.language?.toLowerCase() === fileLangFilter.toLowerCase());
            const isAllSelected = filteredFiles.length > 0 && filteredFiles.every(f => selectedFileIds.includes(f.id));

            const toggleSelectAll = () => {
              if (isAllSelected) {
                const filteredIds = new Set(filteredFiles.map(f => f.id));
                setSelectedFileIds(selectedFileIds.filter(id => !filteredIds.has(id)));
              } else {
                const combined = Array.from(new Set([...selectedFileIds, ...filteredFiles.map(f => f.id)]));
                setSelectedFileIds(combined);
              }
            };

            const toggleFile = (id) => {
              if (selectedFileIds.includes(id)) {
                setSelectedFileIds(selectedFileIds.filter(x => x !== id));
              } else {
                setSelectedFileIds([...selectedFileIds, id]);
              }
            };

            return (
              <div className="space-y-4">
                {/* Stage 2 Architecture Header */}
                <div className="p-4 rounded-lg bg-[#11192e] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 uppercase">
                        Architecture Stage 2
                      </span>
                      <h3 className="text-sm font-bold text-white">Select C, C++, and C# Files for Analysis</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Manually select source code files from the DevGPT dataset to inspect and analyze with static security scanners.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleScanSelectedFiles('Flawfinder')}
                      disabled={selectedFileIds.length === 0 || loading}
                      className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-md transition ${
                        selectedFileIds.length > 0
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Analyze Selected ({selectedFileIds.length}) with Flawfinder</span>
                    </button>
                  </div>
                </div>

                {/* Filters & Bulk Selection */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0d1424] border border-[#1f293d]">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Filter Language:</span>
                    {['ALL', 'c', 'cpp', 'csharp'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setFileLangFilter(lang)}
                        className={`px-2.5 py-1 rounded text-xs font-medium uppercase transition ${
                          fileLangFilter === lang
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-[#162036] text-gray-400 hover:text-white'
                        }`}
                      >
                        {lang === 'ALL' ? `All (${files.length})` : `${lang} (${files.filter(f => f.language?.toLowerCase() === lang.toLowerCase()).length})`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      onClick={() => setSelectedFileIds(filteredFiles.map(f => f.id))}
                      className="px-2.5 py-1 rounded bg-[#162036] hover:bg-[#1e2a44] text-gray-300"
                    >
                      Select All Filtered
                    </button>
                    <button
                      onClick={() => setSelectedFileIds([])}
                      className="px-2.5 py-1 rounded bg-[#162036] hover:bg-[#1e2a44] text-gray-400"
                    >
                      Clear Selection
                    </button>
                    <span className="text-cyan-400 font-mono font-bold pl-2">
                      {selectedFileIds.length} of {files.length} selected
                    </span>
                  </div>
                </div>

                {/* File Table with Checkboxes */}
                <div className="overflow-x-auto rounded-lg border border-[#1f293d]">
                  <table className="w-full text-xs text-left bg-[#11192e]">
                    <thead className="bg-[#162036] text-gray-300">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-0"
                          />
                        </th>
                        <th className="p-3">File Identifier</th>
                        <th className="p-3">Language</th>
                        <th className="p-3">Snapshot</th>
                        <th className="p-3">Code LOC</th>
                        <th className="p-3">Total Lines</th>
                        <th className="p-3">Origin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]">
                      {filteredFiles.map((f) => {
                        const isSelected = selectedFileIds.includes(f.id);
                        return (
                          <tr 
                            key={f.id} 
                            onClick={() => toggleFile(f.id)}
                            className={`cursor-pointer transition ${isSelected ? 'bg-cyan-950/20 hover:bg-cyan-950/30' : 'hover:bg-[#152038]'}`}
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleFile(f.id)}
                                className="rounded border-gray-600 bg-gray-900 text-cyan-500 focus:ring-0"
                              />
                            </td>
                            <td className="p-3 font-mono text-cyan-300 font-semibold">{f.relative_path}</td>
                            <td className="p-3 uppercase font-semibold text-gray-300">{f.language}</td>
                            <td className="p-3 text-gray-400">{f.snapshot}</td>
                            <td className="p-3 text-emerald-400 font-bold">{f.code_lines}</td>
                            <td className="p-3 text-gray-400">{f.total_lines}</td>
                            <td className="p-3 text-gray-400">{f.source_origin}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* 6. SCANNER MANAGEMENT */}
          {activeTab === 'scanner_mgmt' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                  Static Analysis Security Scanners (SAST)
                </h3>
                <p className="text-xs text-gray-400">
                  Adapters implement graceful local execution checking. Missing tools or unauthenticated scanners (e.g. Snyk) are reported gracefully without crashing or fabricating results.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scanners.map((sc) => (
                  <div key={sc.scanner_name} className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-white">{sc.scanner_name}</h4>
                      {sc.installed ? (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Installed {sc.version ? `(v${sc.version})` : ''}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>Not Installed Locally</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>Supported Languages: <strong className="text-gray-200">{sc.supported_languages?.join(', ')}</strong></p>
                      {sc.notes && <p className="text-amber-400/90 italic">{sc.notes}</p>}
                    </div>
                    <button
                      onClick={() => handleRunScan(sc.scanner_name)}
                      disabled={!sc.installed || loading}
                      className={`w-full py-1.5 rounded text-xs font-medium transition ${
                        sc.installed 
                          ? 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' 
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      }`}
                    >
                      {sc.installed ? `Run ${sc.scanner_name} Scan` : 'Unavailable (Not Installed)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. SECURITY FINDINGS */}
          {activeTab === 'findings' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                <h3 className="text-sm font-bold text-white">Normalized Security Findings ({findings.length})</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={findingSeverityFilter}
                    onChange={(e) => setFindingSeverityFilter(e.target.value)}
                    className="bg-[#0d1424] border border-[#1f293d] rounded px-3 py-1.5 text-xs text-gray-300"
                  >
                    <option value="">All Severities</option>
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="note/info">Note/Info</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#1f293d]">
                <table className="w-full text-xs text-left bg-[#11192e]">
                  <thead className="bg-[#162036] text-gray-300">
                    <tr>
                      <th className="p-3">Scanner</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">CWE</th>
                      <th className="p-3">File : Line</th>
                      <th className="p-3">Message</th>
                      <th className="p-3">Review Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]">
                    {findings
                      .filter(f => !findingSeverityFilter || f.severity === findingSeverityFilter)
                      .map((f) => (
                        <tr key={f.id} className="hover:bg-[#152038]">
                          <td className="p-3 font-semibold text-white">{f.scanner}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              f.severity === 'error' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                              f.severity === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}>
                              {f.severity}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-cyan-400">{f.cwe_id || 'Unknown'}</td>
                          <td className="p-3 font-mono text-gray-300">{f.file_path} : {f.line_number}</td>
                          <td className="p-3 text-gray-300 max-w-xs truncate">{f.message}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              f.review_status === 'confirmed_vulnerability' ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50' :
                              f.review_status === 'false_positive' ? 'bg-gray-800 text-gray-400' :
                              'bg-amber-900/30 text-amber-300'
                            }`}>
                              {f.review_status}
                            </span>
                          </td>
                          <td className="p-3 flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedFinding(f);
                                setActiveTab('vulnerability_details');
                              }}
                              className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded text-[11px]"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleAskAIToRepair(f)}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium flex items-center space-x-1 shadow-sm transition"
                              title="Stage 6: Ask AI Model to Identify & Repair Vulnerability"
                            >
                              <Cpu className="w-3 h-3 text-emerald-400" />
                              <span>AI Repair</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. VULNERABILITY DETAILS & REVIEW */}
          {activeTab === 'vulnerability_details' && (
            <div className="space-y-6">
              {selectedFinding ? (
                <div className="p-5 rounded-lg bg-[#11192e] border border-cyan-500/30 space-y-4">
                  <div className="flex items-start justify-between border-b border-[#1f293d] pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-base">Finding #{selectedFinding.id}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-300 font-mono">
                          {selectedFinding.cwe_id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300">
                          {selectedFinding.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{selectedFinding.file_path} at line {selectedFinding.line_number}</p>
                    </div>
                    <button
                      onClick={() => handleGenerateRepair(selectedFinding.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Generate Repair Patch</span>
                    </button>
                  </div>

                  <div className="text-xs space-y-2">
                    <p><strong className="text-gray-300">Scanner:</strong> {selectedFinding.scanner} ({selectedFinding.rule_id})</p>
                    <p><strong className="text-gray-300">Message:</strong> {selectedFinding.message}</p>
                    {selectedFinding.code_snippet && (
                      <div className="mt-2">
                        <p className="text-gray-400 mb-1">Code Snippet:</p>
                        <pre className="p-3 bg-[#0a0e17] rounded border border-[#1f293d] font-mono text-cyan-300 overflow-x-auto">
                          {selectedFinding.code_snippet}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Manual Validation Box */}
                  <div className="p-4 rounded bg-[#0e1628] border border-[#1f293d] space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Manual Expert Verification
                    </h4>
                    <div className="flex items-center space-x-3 text-xs">
                      <label className="flex items-center space-x-1.5">
                        <input
                          type="radio"
                          name="reviewStatus"
                          value="confirmed_vulnerability"
                          checked={reviewStatus === 'confirmed_vulnerability'}
                          onChange={(e) => setReviewStatus(e.target.value)}
                        />
                        <span className="text-rose-300">Confirmed Vulnerability</span>
                      </label>
                      <label className="flex items-center space-x-1.5">
                        <input
                          type="radio"
                          name="reviewStatus"
                          value="false_positive"
                          checked={reviewStatus === 'false_positive'}
                          onChange={(e) => setReviewStatus(e.target.value)}
                        />
                        <span className="text-gray-400">False Positive</span>
                      </label>
                      <label className="flex items-center space-x-1.5">
                        <input
                          type="radio"
                          name="reviewStatus"
                          value="uncertain"
                          checked={reviewStatus === 'uncertain'}
                          onChange={(e) => setReviewStatus(e.target.value)}
                        />
                        <span className="text-amber-300">Uncertain</span>
                      </label>
                    </div>

                    <textarea
                      placeholder="Add reviewer notes regarding security validation..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-[#090d17] border border-[#1f293d] rounded p-2 text-xs text-white"
                    />

                    <button
                      onClick={() => handleReviewFinding(selectedFinding.id)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium"
                    >
                      Save Manual Review
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-lg bg-[#11192e] border border-[#1f293d] text-center text-xs text-gray-400">
                  Select a finding from the Security Findings tab to inspect its details.
                </div>
              )}
            </div>
          )}

          {/* 9. CWE ANALYSIS */}
          {activeTab === 'cwe_analysis' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Common Weakness Enumeration (CWE) Distribution
                </h3>
                <p className="text-xs text-gray-400">
                  Paper Table 8 records 66 CWE assignments across 56 confirmed vulnerabilities. Mapped against MITRE 2024 Top 25 Most Dangerous Weaknesses.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#1f293d]">
                <table className="w-full text-xs text-left bg-[#11192e]">
                  <thead className="bg-[#162036] text-gray-300">
                    <tr>
                      <th className="p-3">CWE ID</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Local Detections</th>
                      <th className="p-3">Paper Count (Table 8)</th>
                      <th className="p-3">2024 Top 25 Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]">
                    {cweData.map((item) => (
                      <tr key={item.cwe} className="hover:bg-[#152038]">
                        <td className="p-3 font-bold text-cyan-400">{item.cwe}</td>
                        <td className="p-3 text-gray-300">{item.description}</td>
                        <td className="p-3 font-bold text-emerald-400">{item.count}</td>
                        <td className="p-3 text-gray-400 font-mono">Reported in Table 8</td>
                        <td className="p-3">
                          {item.top_25_rank !== '-' ? (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/20 text-rose-300 font-bold">
                              #{item.top_25_rank}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. LANGUAGE-WISE ANALYSIS */}
          {activeTab === 'lang_analysis' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Language-wise Security Analysis: C vs C++ vs C#
                </h3>
                <p className="text-xs text-gray-400">
                  Paper Table 9 confirms C has the highest defect density (10.4 LOC/detect), followed by C++ (83.8 LOC/detect), while C# is safest (2,937.5 LOC/detect).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {langStats.map((l) => (
                  <div key={l.language} className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-2">
                    <h4 className="text-base font-bold text-white uppercase">{l.language}</h4>
                    <div className="text-xs space-y-1 text-gray-400">
                      <p>Files: <strong className="text-white">{l.files}</strong></p>
                      <p>Lines of Code: <strong className="text-cyan-400">{l.lines_of_code}</strong></p>
                      <p>Detections: <strong className="text-amber-400">{l.detections}</strong></p>
                      <p>LOC per Detection: <strong className="text-emerald-400">{l.loc_per_detection}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. SNAPSHOT-WISE ANALYSIS */}
          {activeTab === 'snapshot_analysis' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                  DevGPT Snapshot Breakdown: 20231012 vs 20240514
                </h3>
                <p className="text-xs text-gray-400">
                  DevGPT snapshots are non-incremental. Paper Table 2 details 10,378 total sharings across October 2023 and May 2024.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase">snapshot_20231012 (Oct 2023)</h4>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                    <li>4,733 GPT interaction sharings in paper</li>
                    <li>1,377 C-family source files analyzed (121 C, 427 C++, 829 C#)</li>
                    <li>63 candidate files selected for in-depth LLM analysis</li>
                    <li>28 confirmed security vulnerabilities (Table 12)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase">snapshot_20240514 (May 2024)</h4>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                    <li>5,645 GPT interaction sharings in paper</li>
                    <li>938 C-family source files analyzed (204 C, 563 C++, 171 C#)</li>
                    <li>51 candidate files selected for in-depth LLM analysis</li>
                    <li>28 confirmed security vulnerabilities (Table 12)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 12. REPAIR SUGGESTIONS */}
          {activeTab === 'repair_suggestions' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Vulnerability Remediation Configuration</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Select between deterministic rule-based repair patterns (reproducing mitigations in Listings 4, 7, 8 of the paper) or local offline Ollama inference.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="repairMode"
                      value="rule_based"
                      checked={repairEngineMode === 'rule_based'}
                      onChange={(e) => setRepairEngineMode(e.target.value)}
                    />
                    <span className="text-white font-semibold">Deterministic Rule-Based (Safe AST/Regex Patterns)</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="repairMode"
                      value="ollama_local"
                      checked={repairEngineMode === 'ollama_local'}
                      onChange={(e) => setRepairEngineMode(e.target.value)}
                    />
                    <span className="text-white font-semibold">Local Ollama Model (Offline localhost)</span>
                  </label>

                  {repairEngineMode === 'ollama_local' && (
                    <select
                      value={selectedOllamaModel}
                      onChange={(e) => setSelectedOllamaModel(e.target.value)}
                      className="bg-[#0d1424] border border-[#1f293d] rounded px-3 py-1 text-xs text-cyan-300"
                    >
                      {ollamaStatus?.available_models?.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                <h4 className="text-xs font-bold text-gray-300 uppercase mb-3">All Generated Patches ({patches.length})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#162036] text-gray-300">
                      <tr>
                        <th className="p-2.5">Patch ID</th>
                        <th className="p-2.5">Engine</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Rescan Outcome</th>
                        <th className="p-2.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]">
                      {patches.map((p) => (
                        <tr key={p.id} className="hover:bg-[#152038]">
                          <td className="p-2.5 font-bold text-cyan-300">Patch #{p.id}</td>
                          <td className="p-2.5 text-gray-300 uppercase">{p.engine_type} {p.model_name ? `(${p.model_name})` : ''}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              p.status === 'applied' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              p.status === 'rolled_back' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {p.rescan_passed === true ? (
                              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Vulnerability Eliminated</span>
                              </span>
                            ) : p.rescan_passed === false ? (
                              <span className="text-rose-400 font-semibold">Remaining Finding</span>
                            ) : (
                              <span className="text-gray-500">Pending Rescan</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <button
                              onClick={() => {
                                setSelectedPatch(p);
                                setActiveTab('patch_review');
                              }}
                              className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded text-[11px]"
                            >
                              Review Diff
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 13. PATCH REVIEW & APPROVAL */}
          {activeTab === 'patch_review' && (
            <div className="space-y-6">
              {selectedPatch ? (
                <div className="p-5 rounded-lg bg-[#11192e] border border-cyan-500/30 space-y-4">
                  <div className="flex items-start justify-between border-b border-[#1f293d] pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-white">Review Patch #{selectedPatch.id}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-300 uppercase">
                          {selectedPatch.engine_type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${
                          selectedPatch.status === 'applied' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {selectedPatch.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{selectedPatch.explanation}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {selectedPatch.status !== 'applied' ? (
                        <button
                          onClick={() => handleApplyPatch(selectedPatch.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Apply Patch</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRollbackPatch(selectedPatch.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
                        >
                          <Undo className="w-3.5 h-3.5" />
                          <span>Rollback Patch</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Unified Diff View */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-300 uppercase">Unified Diff Preview</h4>
                    <pre className="p-3 bg-[#080d17] border border-[#1f293d] rounded font-mono text-xs overflow-x-auto text-gray-300 leading-relaxed max-h-96">
                      {selectedPatch.diff_unified ? (
                        selectedPatch.diff_unified.split('\n').map((line, i) => {
                          let color = 'text-gray-300';
                          if (line.startsWith('+')) color = 'text-emerald-400 bg-emerald-950/30 font-semibold';
                          else if (line.startsWith('-')) color = 'text-rose-400 bg-rose-950/30 font-semibold';
                          else if (line.startsWith('@')) color = 'text-cyan-400';
                          return <div key={i} className={color}>{line}</div>;
                        })
                      ) : (
                        <div>No diff available</div>
                      )}
                    </pre>
                  </div>

                  {selectedPatch.rescan_details && (
                    <div className="p-3 rounded bg-[#090e1a] border border-[#1f293d] text-xs">
                      <strong className="text-cyan-300">Rescan Verification:</strong> {selectedPatch.rescan_details}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-lg bg-[#11192e] border border-[#1f293d] text-center text-xs text-gray-400">
                  Select a patch from the Repair Suggestions tab to inspect its diff and approve application.
                </div>
              )}
            </div>
          )}

          {/* 14. BEFORE/AFTER RESCAN */}
          {activeTab === 'before_after' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Automated Before & After Rescan Validation
                </h3>
                <p className="text-xs text-gray-400">
                  Whenever a proposed patch is approved and applied to a file, the system automatically re-invokes the static security scanner (Flawfinder / Semgrep / Cppcheck) to verify whether the target vulnerability was eliminated.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patches.filter(p => p.status === 'applied').map((p) => (
                  <div key={p.id} className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300">Patch #{p.id} Rescan</span>
                      <span className="text-gray-400">{p.engine_type}</span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono">{p.rescan_details}</p>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      Outcome: {p.rescan_passed ? '✓ Vulnerability successfully cleared' : '✗ Warning still flagged'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 15. LOCAL MODEL SETUP */}
          {activeTab === 'local_model' && (
            <div className="space-y-6">
              <div className="p-5 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Local AI Inference via Ollama (Zero Cloud APIs)</span>
                </h3>
                <p className="text-xs text-gray-400">
                  In accordance with strict research reproducibility rules, no cloud APIs (OpenAI, Anthropic, Gemini) are used. The system interfaces directly with a locally installed Ollama instance over localhost.
                </p>

                <div className="p-4 rounded bg-[#0d1424] border border-[#1f293d] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ollama Installed Locally:</span>
                    <strong className={ollamaStatus?.installed ? 'text-emerald-400' : 'text-rose-400'}>
                      {ollamaStatus?.installed ? 'Yes (flawfinder & ollama detected)' : 'No'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service Reachable on {ollamaStatus?.endpoint}:</span>
                    <strong className={ollamaStatus?.service_online ? 'text-emerald-400' : 'text-amber-400'}>
                      {ollamaStatus?.service_online ? 'Online' : 'Offline (Falling back to Deterministic Rules)'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available Local Models:</span>
                    <strong className="text-cyan-300">{ollamaStatus?.available_models?.join(', ') || 'None'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 16. EVALUATION RESULTS */}
          {activeTab === 'evaluation_results' && (() => {
            const totalFindings = findings.length;
            const confirmedVulnerabilities = findings.filter(f => f.review_status === 'confirmed_vulnerability').length;
            const patchesGenerated = patches.length;
            const patchesApplied = patches.filter(p => p.status === 'applied').length;
            const fixesValidated = patches.filter(p => p.rescan_passed === true).length;
            const remainingVulnerabilities = Math.max(0, totalFindings - fixesValidated);
            const repairSuccessRate = patchesGenerated > 0 
              ? ((fixesValidated / patchesGenerated) * 100).toFixed(1) 
              : '0.0';
            const detectionRate = datasetSummary?.total_files > 0 
              ? ((totalFindings / datasetSummary.total_files)).toFixed(2) 
              : '0.00';

            return (
              <div className="space-y-6">
                {/* Stage 7 Header */}
                <div className="p-4 rounded-lg bg-[#11192e] border border-cyan-500/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 uppercase">
                        Architecture Stage 7
                      </span>
                      <h3 className="text-sm font-bold text-white">Calculate Detection and Repair Performance</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Strict empirical evaluation calculated solely from actual scanner detections, applied safe-copy patches, and rescan verification results.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateReports}
                    disabled={loading}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Evaluation CSVs</span>
                  </button>
                </div>

                {/* 7 Performance Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                    <p className="text-xs text-gray-400 uppercase font-semibold">1. Evaluated Files</p>
                    <p className="text-2xl font-bold text-white mt-1">{datasetSummary?.total_files || 0} Files</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{datasetSummary?.total_loc || 0} Code LOC in DevGPT</p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                    <p className="text-xs text-gray-400 uppercase font-semibold">2. Vulnerabilities Detected</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{totalFindings} Findings</p>
                    <p className="text-[11px] text-amber-400/80 mt-0.5">Live Flawfinder SAST run</p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                    <p className="text-xs text-gray-400 uppercase font-semibold">3. Detection Density</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">{detectionRate} Det/File</p>
                    <p className="text-[11px] text-cyan-400/80 mt-0.5">
                      {datasetSummary?.total_loc && totalFindings > 0 
                        ? (datasetSummary.total_loc / totalFindings).toFixed(1) + ' LOC per detection' 
                        : '-'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                    <p className="text-xs text-gray-400 uppercase font-semibold">4. Repair Suggestions</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{patchesGenerated} Patches</p>
                    <p className="text-[11px] text-purple-300 mt-0.5">Rule AST & Ollama Local</p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                    <p className="text-xs text-gray-400 uppercase font-semibold">5. Patches Applied</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{patchesApplied} Applied</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">With automated pre-patch backup</p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                    <p className="text-xs text-gray-400 uppercase font-semibold">6. Fixes Validated</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{fixesValidated} Rescan Passed</p>
                    <p className="text-[11px] text-emerald-400/80 mt-0.5">Vulnerability signature eliminated</p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                    <p className="text-xs text-gray-400 uppercase font-semibold">7. Remaining Unfixed</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">{remainingVulnerabilities} Findings</p>
                    <p className="text-[11px] text-rose-300/80 mt-0.5">Pending triage / repair</p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#11192e] border border-cyan-500/40">
                    <p className="text-xs text-cyan-300 uppercase font-semibold">Repair Success Rate</p>
                    <p className="text-2xl font-bold text-cyan-300 mt-1">{repairSuccessRate}%</p>
                    <p className="text-[11px] text-cyan-400/80 mt-0.5">Validated Fixes / Patches Generated</p>
                  </div>
                </div>

                {/* Performance Evaluation Table */}
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Rigorous Performance Formula & Metric Audit
                  </h4>
                  <div className="overflow-x-auto rounded border border-[#1f293d]">
                    <table className="w-full text-xs text-left bg-[#0d1424]">
                      <thead className="bg-[#162036] text-gray-300">
                        <tr>
                          <th className="p-3">Performance Dimension</th>
                          <th className="p-3">Calculated Value</th>
                          <th className="p-3">Documented Formula / Denominator</th>
                          <th className="p-3">Validation Rule</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f293d]">
                        <tr>
                          <td className="p-3 font-semibold text-white">Vulnerabilities Evaluated</td>
                          <td className="p-3 font-bold text-cyan-300">{datasetSummary?.total_files || 0} Files</td>
                          <td className="p-3 text-gray-400">Total source code files loaded in data/devgpt/</td>
                          <td className="p-3 text-emerald-400 font-semibold">Real File Count</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">Vulnerabilities Detected</td>
                          <td className="p-3 font-bold text-amber-400">{totalFindings} Findings</td>
                          <td className="p-3 text-gray-400">Output from live static scanner parser (Flawfinder)</td>
                          <td className="p-3 text-emerald-400 font-semibold">Real Scanner Output</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">Repair Suggestions Generated</td>
                          <td className="p-3 font-bold text-purple-400">{patchesGenerated} Proposed</td>
                          <td className="p-3 text-gray-400">AST/regex rules and local Ollama model fixes</td>
                          <td className="p-3 text-gray-400">Not Counted as Fixed</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">Patches Applied & Verified</td>
                          <td className="p-3 font-bold text-emerald-400">{fixesValidated} Verified</td>
                          <td className="p-3 text-gray-400">Patches where rescan confirms vulnerability eliminated</td>
                          <td className="p-3 text-emerald-400 font-semibold">Post-Patch Rescan Verified</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">Repair Success Rate (%)</td>
                          <td className="p-3 font-bold text-cyan-400">{repairSuccessRate}%</td>
                          <td className="p-3 text-gray-400 font-mono">(Fixes Validated / Patches Generated) × 100</td>
                          <td className="p-3 text-emerald-400 font-semibold">Denominator Strictly Enforced</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 17. PAPER VS LOCAL COMPARISON */}
          {activeTab === 'paper_vs_local' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#11192e] border border-cyan-500/40">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 uppercase">
                    SECTION A
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">RESEARCH PAPER REPORTED RESULTS</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Historical results from the published journal paper.</p>
                </div>
                <div className="p-4 rounded-lg bg-[#11192e] border border-emerald-500/40">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                    SECTION B
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">ACTUAL LOCAL IMPLEMENTATION RESULTS</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Metrics generated by local scanner and repair runs.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#1f293d]">
                <table className="w-full text-xs text-left bg-[#11192e]">
                  <thead className="bg-[#162036] text-gray-300">
                    <tr>
                      <th className="p-3">Evaluation Metric</th>
                      <th className="p-3 text-cyan-300">Paper Value (Sec A)</th>
                      <th className="p-3 text-emerald-300">Local Value (Sec B)</th>
                      <th className="p-3">Comparable?</th>
                      <th className="p-3">Scientific Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]">
                    {paperVsLocal.map((c, i) => (
                      <tr key={i} className="hover:bg-[#152038]">
                        <td className="p-3 font-semibold text-white">{c.metric}</td>
                        <td className="p-3 font-bold text-cyan-300">{String(c.paper_value)}</td>
                        <td className="p-3 font-bold text-emerald-300">{String(c.local_value)}</td>
                        <td className="p-3">
                          {c.comparable ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                              Comparable
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                              Subset / Non-identical
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-400 max-w-md">{c.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 18. REPORTS & EXPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="p-5 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Research Reports & CSV Export Center</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Exports stored data into standard CSV and Markdown evaluation reports located in <code className="text-cyan-300 bg-[#0d1424] px-2 py-0.5 rounded">reports/</code>.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleGenerateReports}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-md transition"
                  >
                    Generate All Evaluation Reports
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-2">
                  <h4 className="font-bold text-white">Generated CSV Artifacts:</h4>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside font-mono text-[11px]">
                    <li>reports/dataset_report.csv</li>
                    <li>reports/scanner_results.csv</li>
                    <li>reports/normalized_findings.csv</li>
                    <li>reports/cwe_distribution.csv</li>
                    <li>reports/repair_results.csv</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-2">
                  <h4 className="font-bold text-white">Comprehensive Markdown Report:</h4>
                  <p className="text-gray-300 text-xs">
                    <code>reports/final_evaluation_report.md</code> synthesizes all local findings, file counts, and compares them rigorously against the 18 research paper tables.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 19. PROJECT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="p-5 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Project Configuration & Rules</h3>
                <div className="text-xs space-y-2 text-gray-300">
                  <p><strong className="text-white">Backend Port:</strong> 8000</p>
                  <p><strong className="text-white">Frontend Port:</strong> 5173</p>
                  <p><strong className="text-white">Database:</strong> SQLite local file <code>securecode_ai.db</code></p>
                  <p><strong className="text-white">API Keys Required:</strong> NONE (Strict Rule 2)</p>
                  <p><strong className="text-white">Cloud AI Services:</strong> DISABLED (Strict Rule 3)</p>
                </div>
              </div>
            </div>
          )}

          {/* 20. SYSTEM HEALTH & LOGS */}
          {activeTab === 'health_logs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <p className="text-xs text-gray-400">Backend Status</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">Healthy & Connected</p>
                </div>
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <p className="text-xs text-gray-400">Ollama Local Status</p>
                  <p className="text-base font-bold text-cyan-400 mt-1">
                    {ollamaStatus?.service_online ? 'Online (localhost:11434)' : 'Offline (Rule fallback active)'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d]">
                  <p className="text-xs text-gray-400">Audit Events Logged</p>
                  <p className="text-base font-bold text-white mt-1">{auditLogs.length} events</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#11192e] border border-[#1f293d] space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase">System Audit Log</h4>
                <div className="max-h-72 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-2 rounded bg-[#0d1424] text-gray-300 flex justify-between">
                      <span>[{log.action}] {log.details}</span>
                      <span className="text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
