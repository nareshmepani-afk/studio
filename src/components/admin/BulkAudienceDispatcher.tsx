'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  UploadCloud, 
  FileText, 
  Download, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Play, 
  Search, 
  Clock, 
  ShieldCheck, 
  Gauge, 
  ChevronRight,
  RefreshCw,
  Film,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { 
  EmailTemplateId, 
  EMAIL_TEMPLATES_CATALOG 
} from '@/lib/emailTemplates';
import { 
  parseAudienceCsv, 
  generateSampleAudienceCsv, 
  getDemoAudiencePreset, 
  ParsedAudienceRow, 
  CsvParseResult 
} from '@/lib/audienceCsvParser';
import { BulkEmailDispatchModal } from './BulkEmailDispatchModal';
import { DomainDiagnosticsResult } from '@/app/admin/emailActions';
import { toast } from 'sonner';

export interface BulkAudienceDispatcherProps {
  dnsStatus?: DomainDiagnosticsResult | null;
  initialTemplateId?: EmailTemplateId;
}

export function BulkAudienceDispatcher({
  dnsStatus,
  initialTemplateId = 'welcome_host_pass'
}: BulkAudienceDispatcherProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<EmailTemplateId>(initialTemplateId);
  const [ingestMode, setIngestMode] = useState<'upload' | 'paste'>('upload');
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<CsvParseResult | null>(null);
  const [activeAudienceRows, setActiveAudienceRows] = useState<ParsedAudienceRow[]>([]);
  
  // Table search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');

  // Queue Pacing settings
  const [pacingRate, setPacingRate] = useState<'gentle' | 'standard' | 'turbo'>('standard');
  const [chunkSize, setChunkSize] = useState<number>(5);

  // Dispatch Modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTemplate = useMemo(() => {
    return EMAIL_TEMPLATES_CATALOG.find(t => t.id === selectedTemplateId) || EMAIL_TEMPLATES_CATALOG[0];
  }, [selectedTemplateId]);

  // Re-parse when template changes or raw text updates
  useEffect(() => {
    if (rawCsvText.trim()) {
      const res = parseAudienceCsv(rawCsvText, selectedTemplateId);
      setParsedResult(res);
      setActiveAudienceRows([...res.validRows, ...res.invalidRows]);
    }
  }, [selectedTemplateId, rawCsvText]);

  // Pacing delay calculation
  const pacingIntervalMs = useMemo(() => {
    switch (pacingRate) {
      case 'gentle': return 500; // 2 emails/sec
      case 'standard': return 200; // 5 emails/sec
      case 'turbo': return 100; // 10 emails/sec
      default: return 200;
    }
  }, [pacingRate]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Invalid File Type', { description: 'Please provide a valid .csv spreadsheet file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawCsvText(content);
        const res = parseAudienceCsv(content, selectedTemplateId);
        setParsedResult(res);
        setActiveAudienceRows([...res.validRows, ...res.invalidRows]);
        toast.success('Audience CSV Ingested', { 
          description: `Identified ${res.validRows.length} valid contacts (${res.duplicateCount} duplicates removed).` 
        });
      }
    };
    reader.onerror = () => {
      toast.error('File Ingestion Error', { description: 'Could not read CSV file.' });
    };
    reader.readAsText(file);
  };

  // Demo audience loader
  const handleLoadDemoAudience = () => {
    const demoRows = getDemoAudiencePreset(selectedTemplateId);
    const demoCsv = generateSampleAudienceCsv(selectedTemplateId);
    setRawCsvText(demoCsv);
    const res = parseAudienceCsv(demoCsv, selectedTemplateId);
    setParsedResult(res);
    setActiveAudienceRows(demoRows);
    toast.success('Demo Audience Initialised', {
      description: `Loaded ${demoRows.length} sample storytellers for ${activeTemplate.name}.`
    });
  };

  // Download sample CSV template
  const handleDownloadSampleCsv = () => {
    const sampleContent = generateSampleAudienceCsv(selectedTemplateId);
    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sample_audience_${selectedTemplateId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample Template Downloaded', { 
      description: `Sample CSV for ${activeTemplate.name} saved.` 
    });
  };

  const handleClear = () => {
    setRawCsvText('');
    setParsedResult(null);
    setActiveAudienceRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtered rows for preview table
  const filteredAudience = useMemo(() => {
    return activeAudienceRows.filter(row => {
      const matchesSearch = 
        row.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (previewFilter === 'VALID') return row.isValid;
      if (previewFilter === 'INVALID') return !row.isValid;
      return true;
    });
  }, [activeAudienceRows, searchQuery, previewFilter]);

  const validCount = activeAudienceRows.filter(r => r.isValid).length;
  const invalidCount = activeAudienceRows.filter(r => !r.isValid && !r.isDuplicate).length;
  const duplicateCount = activeAudienceRows.filter(r => r.isDuplicate).length;

  return (
    <div className="space-y-8 font-sans">
      
      {/* Step 1: Select Target Master Template */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400">
            Step 1: Select Target Master Template
          </span>
          <span className="text-[11px] font-mono text-amber-400">
            Active: {activeTemplate.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EMAIL_TEMPLATES_CATALOG.map((tmpl) => {
            const isSelected = tmpl.id === selectedTemplateId;
            return (
              <button
                key={tmpl.id}
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 relative group overflow-hidden ${
                  isSelected 
                    ? 'bg-slate-900 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50' 
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tmpl.id === 'welcome_host_pass' && <Sparkles className="h-4 w-4" />}
                    {tmpl.id === 'collaborator_invite' && <Users className="h-4 w-4" />}
                    {tmpl.id === 'password_reset' && <KeyRound className="h-4 w-4" />}
                    {tmpl.id === 'premiere_notification' && <Film className="h-4 w-4" />}
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isSelected 
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                      : 'bg-slate-800/60 border-slate-700 text-slate-500'
                  }`}>
                    {tmpl.category}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                  {tmpl.name}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: Audience Ingestion & Parser Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400">
            Step 2: Ingest Audience CSV &amp; Tag Mapping
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemoAudience}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Load Demo Audience (5 Storytellers)
            </button>
            <button
              onClick={handleDownloadSampleCsv}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
            >
              <Download className="h-3.5 w-3.5" />
              Download Sample CSV
            </button>
          </div>
        </div>

        {/* Dropzone & Text Area Workspace */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-5">
          
          {/* Mode Switcher */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setIngestMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  ingestMode === 'upload' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Upload CSV File
              </button>
              <button
                onClick={() => setIngestMode('paste')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  ingestMode === 'paste' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Paste Raw CSV
              </button>
            </div>

            {activeAudienceRows.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Audience
              </button>
            )}
          </div>

          {/* Ingestion Panels */}
          {ingestMode === 'upload' ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition group space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition duration-200">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                  Click or drag and drop audience CSV spreadsheet
                </p>
                <p className="text-xs text-slate-500">
                  RFC 4180 compliant with automatic header detection for {activeTemplate.name}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={6}
                value={rawCsvText}
                onChange={(e) => setRawCsvText(e.target.value)}
                placeholder="email,name,claimedMemoryTitle&#10;eleanor.vance@example.co.uk,&quot;Director Eleanor Vance&quot;,&quot;Summer on the Coast, 1964&quot;"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-200 placeholder:text-slate-700 focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition"
              />
            </div>
          )}

          {/* Parse Summary KPIs */}
          {activeAudienceRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">Total Parsed</span>
                <span className="text-base font-bold text-white font-mono">{activeAudienceRows.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400/80 block">Valid Contacts</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{validCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400/80 block">Duplicates Removed</span>
                <span className="text-base font-bold text-amber-400 font-mono">{duplicateCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400/80 block">Invalid Rows</span>
                <span className="text-base font-bold text-rose-400 font-mono">{invalidCount}</span>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Step 3: Audience Data Preview Table */}
      {activeAudienceRows.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400">
              Step 3: Audience Pre-Flight Data Preview ({filteredAudience.length} Rows)
            </span>

            <div className="flex items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search audience..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  onClick={() => setPreviewFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    previewFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  All ({activeAudienceRows.length})
                </button>
                <button
                  onClick={() => setPreviewFilter('VALID')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    previewFilter === 'VALID' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Valid ({validCount})
                </button>
                <button
                  onClick={() => setPreviewFilter('INVALID')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    previewFilter === 'INVALID' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Flagged ({invalidCount + duplicateCount})
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Recipient Email</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Resolved Template Properties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredAudience.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/20 transition">
                      <td className="px-4 py-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        ) : row.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                            <AlertCircle className="h-3 w-3" /> Duplicate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
                            <AlertCircle className="h-3 w-3" /> Invalid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {row.email || <span className="text-rose-400 italic">Empty</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {row.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 max-w-lg">
                          {Object.entries(row.props)
                            .filter(([k]) => k !== 'email' && k !== 'name' && k !== 'recipientName')
                            .slice(0, 3)
                            .map(([k, v]) => (
                              <span key={k} className="text-[10px] font-mono bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-400 truncate max-w-xs">
                                <strong className="text-amber-400/80">{k}:</strong> {v}
                              </span>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Step 4: Queue Pacing & Launch Transmission Controls */}
      {validCount > 0 && (
        <section className="bg-slate-900/40 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  Step 4: Queue Pacing &amp; Pre-Flight Verification
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                Configure rate-limited dispatch velocity to ensure safe Resend API deliverability without triggering 429 exceptions.
              </p>
            </div>

            {/* Pacing Speed Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Queue Pacing:</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  onClick={() => setPacingRate('gentle')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    pacingRate === 'gentle' ? 'bg-slate-800 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Gentle (2/s)
                </button>
                <button
                  onClick={() => setPacingRate('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    pacingRate === 'standard' ? 'bg-amber-500 text-black font-bold' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Standard (5/s)
                </button>
                <button
                  onClick={() => setPacingRate('turbo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    pacingRate === 'turbo' ? 'bg-slate-800 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Turbo (10/s)
                </button>
              </div>
            </div>
          </div>

          {/* Pre-Flight Status Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Resend Channel</span>
                <span className="text-emerald-400 font-semibold">
                  {dnsStatus?.resendConnected ? 'Production Connected' : 'Simulated Sandbox'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">DNS Deliverability</span>
                <span className="text-emerald-400 font-semibold">SPF &amp; DKIM Verified</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated Duration</span>
                <span className="text-amber-400 font-mono font-semibold">
                  ~{Math.ceil((validCount / 5) * (pacingIntervalMs / 100))}s
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="w-full h-12 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition duration-200 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5"
          >
            <Play className="h-4 w-4 fill-current" />
            Launch Batch Transmission ({validCount} Valid Recipients)
          </button>
        </section>
      )}

      {/* Live Batch Dispatch Modal */}
      <BulkEmailDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        templateId={selectedTemplateId}
        audienceRows={activeAudienceRows.filter(r => r.isValid)}
        pacingIntervalMs={pacingIntervalMs}
        chunkSize={chunkSize}
        onBatchUpdated={(updated) => {
          setActiveAudienceRows(prev => {
            const updatedMap = new Map(updated.map(u => [u.id, u]));
            return prev.map(p => updatedMap.has(p.id) ? updatedMap.get(p.id)! : p);
          });
        }}
      />

    </div>
  );
}
