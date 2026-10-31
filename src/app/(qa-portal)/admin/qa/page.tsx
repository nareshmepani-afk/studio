'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  subscribeToQaItems,
  updateQaItem,
  uploadQaScreenshot,
  deleteQaScreenshot,
  type QaChecklistItem,
} from '@/lib/qa/qaFirebaseService';

export const dynamic = 'force-dynamic';

export default function NativeAdminQaPage() {
  const [items, setItems] = useState<Record<string, QaChecklistItem>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'FAIL' | 'PASS'>('ALL');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{ cardId: string; itemId: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToQaItems(
      (cloudItems) => {
        setItems(cloudItems);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const itemList = useMemo(() => Object.values(items).sort((a, b) => a.cardNumber - b.cardNumber || a.id.localeCompare(b.id, undefined, { numeric: true })), [items]);

  const stats = useMemo(() => {
    const total = itemList.length;
    const pass = itemList.filter((i) => i.verdict === 'PASS').length;
    const fail = itemList.filter((i) => i.verdict === 'FAIL').length;
    const retest = itemList.filter((i) => i.verdict === 'RETEST').length;
    const pending = total - (pass + fail + retest);
    const pct = total > 0 ? Math.round((pass / total) * 100) : 0;
    return { total, pass, fail, retest, pending, pct };
  }, [itemList]);

  const filteredItems = useMemo(() => {
    if (filter === 'PENDING') return itemList.filter((i) => i.verdict === 'PENDING');
    if (filter === 'FAIL') return itemList.filter((i) => i.verdict === 'FAIL' || i.verdict === 'RETEST');
    if (filter === 'PASS') return itemList.filter((i) => i.verdict === 'PASS');
    return itemList;
  }, [itemList, filter]);

  const handleCopyFullReport = () => {
    let report = `# 📋 Memory Weaver Cloud QA Report\n`;
    report += `- **Summary**: ${stats.pass} PASS | ${stats.fail} FAIL | ${stats.retest} RETEST | ${stats.pending} PENDING (Total: ${stats.total})\n`;
    report += `- **Cloud Portal**: https://dev.memoryweaver.studio/admin/qa\n`;
    report += `- **Agent CLI Action**: npm run qa:status\n\n`;
    itemList.forEach((item) => {
      report += `### [Item ${item.id}] ${item.title}\n`;
      report += `- Verdict: ${item.verdict}\n- Route: ${item.targetRoute}\n`;
      if (item.notes) report += `- Notes: ${item.notes}\n`;
      if (item.telemetryTrace) report += `- Telemetry: ${item.telemetryTrace}\n`;
      if (item.screenshots?.length) report += `- Screenshots: ${item.screenshots.length} attached\n`;
      report += `\n`;
    });
    navigator.clipboard.writeText(report);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npm run qa:status');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent, cardId: string, itemId: string) => {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    setUploadingItemId(itemId);
    try { await uploadQaScreenshot(cardId, itemId, file); } finally { setUploadingItemId(null); }
  }, []);

  const handleFileDrop = async (e: React.DragEvent, cardId: string, itemId: string) => {
    e.preventDefault();
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    setUploadingItemId(itemId);
    try { await uploadQaScreenshot(cardId, itemId, file); } finally { setUploadingItemId(null); }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const payload = JSON.parse(evt.target?.result as string);
        const verdicts = payload.itemVerdicts || {};
        const notes = payload.itemNotes || {};
        const telemetries = payload.itemTelemetry || {};
        for (const [k, v] of Object.entries(verdicts)) {
          const itemId = k.replace('_', '.');
          await updateQaItem(itemId, {
            verdict: String(v).toUpperCase() as any,
            ...(notes[k] ? { notes: notes[k] } : {}),
            ...(telemetries[k] ? { telemetryTrace: telemetries[k] } : {}),
          });
        }
      } catch (err) {
        alert('Invalid QA JSON export file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="p-6 rounded-2xl bg-[#0D111A] border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">MEMORY WEAVER QA CLOUD</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">🟢 REAL-TIME SYNC</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">Staging Suite &bull; Master Test Deck</h1>
            <p className="text-xs text-gray-400 font-mono">Live Firestore &bull; Unlimited Firebase Storage 4K Evidence Vault</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-black/50 px-3.5 py-2 rounded-xl border border-gray-800 font-mono text-xs">
              <span className="text-emerald-400 font-bold">{stats.pass} PASS</span> &bull;
              <span className="text-rose-400 font-bold">{stats.fail} FAIL</span> &bull;
              <span className="text-amber-400 font-bold">{stats.retest} RETEST</span> &bull;
              <span className="text-gray-400">{stats.pending} PEND</span>
              <span className="ml-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">{stats.pct}%</span>
            </div>
            <button onClick={handleCopyFullReport} className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-mono font-bold text-amber-200 border border-amber-500/40 transition">
              {copiedFull ? '✓ Copied Full Report!' : '📋 Copy Full Report for Agent'}
            </button>
            <button onClick={handleCopyCli} className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-xs font-mono font-bold text-purple-200 border border-purple-500/40 transition" title="Copy agent CLI trigger">
              {copiedCli ? '✓ Copied Directive!' : '⚡ npm run qa:status'}
            </button>
            <label className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-mono font-bold text-sky-300 border border-gray-700 cursor-pointer transition">
              📥 Import JSON
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>
        </header>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          {(['ALL', 'PENDING', 'FAIL', 'PASS'] as const).map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`px-3 py-1.5 rounded-xl border transition ${filter === tab ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold' : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-gray-200'}`}>{tab} ({tab === 'ALL' ? stats.total : tab === 'PENDING' ? stats.pending : tab === 'FAIL' ? stats.fail + stats.retest : stats.pass})</button>
          ))}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-mono text-amber-300/80 animate-pulse">Connecting to Firestore Real-Time Stream...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-sm font-mono text-gray-500 rounded-2xl bg-gray-950 border border-gray-800">No checklist items matching filter &ldquo;{filter}&rdquo;. Run `npm run qa:seed` to populate cards.</div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} onPaste={(e) => handlePaste(e, String(item.cardNumber), item.id)} className="p-5 rounded-2xl bg-[#0A0E17] border border-gray-800/80 hover:border-gray-700 space-y-3.5 shadow-lg transition">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">Item {item.id}</span>
                      <span className="text-xs font-mono text-gray-400">Card {item.cardNumber}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    {item.steps?.length > 0 && (
                      <ul className="text-xs text-gray-300 list-disc list-inside space-y-1 pt-1 pl-1">
                        {item.steps.map((s, idx) => (<li key={idx} className="leading-relaxed">{s}</li>))}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-gray-800 font-mono text-xs">
                      {(['PASS', 'FAIL', 'RETEST', 'PENDING'] as const).map((v) => (
                        <button key={v} onClick={() => updateQaItem(item.id, { verdict: v })} className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${item.verdict === v ? (v === 'PASS' ? 'bg-emerald-500 text-white' : v === 'FAIL' ? 'bg-rose-500 text-white' : v === 'RETEST' ? 'bg-amber-500 text-black' : 'bg-gray-700 text-white') : 'text-gray-400 hover:text-white'}`}>{v}</button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`[Item ${item.id}] ${item.title} -> ${item.verdict}\nRoute: ${item.targetRoute}\nNotes: ${item.notes || 'None'}\nTelemetry: ${item.telemetryTrace || 'None'}\n(Agent Triage: npm run qa:status)`);
                        setCopiedItemId(item.id);
                        setTimeout(() => setCopiedItemId(null), 2000);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-850 hover:bg-gray-750 text-xs font-mono font-bold text-gray-300 border border-gray-700 transition"
                      title="Copy item summary & agent directive to clipboard"
                    >
                      {copiedItemId === item.id ? '✓ Copied!' : '📋 Copy Item'}
                    </button>
                    {item.targetRoute && (
                      <a href={item.targetRoute.startsWith('http') ? item.targetRoute : `https://dev.memoryweaver.studio${item.targetRoute}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition flex items-center gap-1">
                        🔗 Open Test Route ↗
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-amber-300/80 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 gap-2">
                  <span>⚡ Instant Cloud Save: Verdict, notes &amp; telemetry sync to Firestore automatically.</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Agent command:</span>
                    <button
                      type="button"
                      onClick={handleCopyCli}
                      className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Click to copy agent triage directive"
                    >
                      <code>npm run qa:status</code>
                      <span>{copiedCli ? '✓' : '📋'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-gray-900 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1">Narrative Observations &amp; Notes</label>
                    <textarea defaultValue={item.notes || ''} onBlur={(e) => updateQaItem(item.id, { notes: e.target.value })} rows={2} placeholder="Record observations, timing, or feedback..." className="w-full bg-black/50 border border-gray-800 rounded-lg p-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/60" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 flex items-center justify-between">
                      <span>Telemetry Vector &amp; Console Log</span>
                      <button onClick={() => navigator.clipboard.writeText(item.telemetryTrace || '')} className="text-amber-400 hover:underline">📋 Copy</button>
                    </label>
                    <textarea defaultValue={item.telemetryTrace || ''} onBlur={(e) => updateQaItem(item.id, { telemetryTrace: e.target.value })} rows={2} placeholder="Paste telemetry trace or localStorage vector..." className="w-full bg-black/50 border border-gray-800 rounded-lg p-2 text-sky-300 placeholder-gray-600 focus:outline-none focus:border-sky-500/60" />
                  </div>
                </div>

                <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleFileDrop(e, String(item.cardNumber), item.id)} className="p-3 bg-black/40 border border-dashed border-gray-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-mono">📸 Screenshot Evidence ({item.screenshots?.length || 0} attached) &bull; <span className="text-amber-300">Click card &amp; Ctrl+V to paste</span></span>
                    <button onClick={() => { setActiveUploadTarget({ cardId: String(item.cardNumber), itemId: item.id }); fileInputRef.current?.click(); }} className="text-amber-400 hover:underline font-mono text-[11px]">+ Browse Image</button>
                  </div>
                  {uploadingItemId === item.id && <div className="text-xs font-mono text-amber-300 animate-pulse">Streaming image directly to Firebase Cloud Storage...</div>}
                  {item.screenshots && item.screenshots.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                      {item.screenshots.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-800 aspect-video bg-black cursor-pointer">
                          <img src={url} alt={`Evidence ${idx}`} onClick={() => setLightboxImg(url)} className="object-cover w-full h-full group-hover:scale-105 transition" />
                          <button onClick={(e) => { e.stopPropagation(); deleteQaScreenshot(item.id, url); }} className="absolute top-1 right-1 bg-black/80 hover:bg-rose-900 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <input type="file" accept="image/*" ref={fileInputRef} onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && activeUploadTarget) {
            setUploadingItemId(activeUploadTarget.itemId);
            try { await uploadQaScreenshot(activeUploadTarget.cardId, activeUploadTarget.itemId, file); } finally { setUploadingItemId(null); }
          }
        }} className="hidden" />

        {lightboxImg && (
          <div onClick={() => setLightboxImg(null)} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex flex-col items-center justify-center cursor-zoom-out">
            <div className="relative max-w-5xl max-h-[90vh]">
              <img src={lightboxImg} alt="Enlarged Evidence" className="rounded-xl max-h-[85vh] object-contain border border-gray-700 shadow-2xl" />
              <button onClick={() => setLightboxImg(null)} className="absolute -top-3 -right-3 bg-gray-900 text-white rounded-full p-2 border border-gray-600 hover:bg-gray-800 text-xs font-mono">✕ Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
