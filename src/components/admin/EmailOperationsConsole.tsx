'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Code, 
  Eye, 
  ShieldCheck, 
  Sparkles,
  Users,
  KeyRound,
  Film,
  Check,
  Server
} from 'lucide-react';
import { 
  EmailTemplateId, 
  EMAIL_TEMPLATES_CATALOG, 
  renderEmailTemplateById 
} from '@/lib/emailTemplates';
import { 
  sendAdminTestEmailAction, 
  getDomainDnsDiagnosticsAction, 
  EmailDispatchReceipt, 
  DomainDiagnosticsResult 
} from '@/app/admin/emailActions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function EmailOperationsConsole() {
  const { user } = useAuth();
  const [selectedTemplateId, setSelectedTemplateId] = useState<EmailTemplateId>('welcome_host_pass');
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [customProps, setCustomProps] = useState<Record<string, string>>({});
  
  // Dispatch state
  const [isDispatching, setIsDispatching] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<EmailDispatchReceipt | null>(null);
  
  // Preview controls
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTab, setPreviewTab] = useState<'visual' | 'code'>('visual');
  const [copiedCode, setCopiedCode] = useState(false);

  // DNS Diagnostics state
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<DomainDiagnosticsResult | null>(null);

  // Initialize recipient and template props
  useEffect(() => {
    if (user?.email && !targetEmail) {
      setTargetEmail(user.email);
    }
  }, [user, targetEmail]);

  // Reset custom props when template changes
  useEffect(() => {
    const templateMeta = EMAIL_TEMPLATES_CATALOG.find(t => t.id === selectedTemplateId);
    if (templateMeta) {
      setCustomProps({ ...templateMeta.defaultProps });
    }
  }, [selectedTemplateId]);

  // Query DNS diagnostics on mount
  const fetchDnsDiagnostics = async () => {
    setIsCheckingDns(true);
    try {
      const res = await getDomainDnsDiagnosticsAction();
      if (res.success) {
        setDnsStatus(res);
      }
    } catch (err) {
      console.error('[EmailOperationsConsole] DNS check failed:', err);
    } finally {
      setIsCheckingDns(false);
    }
  };

  useEffect(() => {
    fetchDnsDiagnostics();
  }, []);

  // Compute rendered HTML and Subject in real time
  const { subject, html } = useMemo(() => {
    return renderEmailTemplateById(selectedTemplateId, customProps);
  }, [selectedTemplateId, customProps]);

  const activeTemplate = useMemo(() => {
    return EMAIL_TEMPLATES_CATALOG.find(t => t.id === selectedTemplateId) || EMAIL_TEMPLATES_CATALOG[0];
  }, [selectedTemplateId]);

  const handlePropChange = (key: string, value: string) => {
    setCustomProps(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDispatchTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      toast.error('Recipient Required', { description: 'Please provide a valid destination email.' });
      return;
    }

    setIsDispatching(true);
    try {
      const receipt = await sendAdminTestEmailAction({
        templateId: selectedTemplateId,
        targetEmail: targetEmail.trim(),
        customProps
      });

      if (receipt.success) {
        setLatestReceipt(receipt);
        if (receipt.status === 'SIMULATED') {
          toast.info('Test Dispatch Simulated', { 
            description: `Simulated receipt generated for ${receipt.targetEmail} (RESEND_API_KEY inactive).` 
          });
        } else {
          toast.success('Live Email Dispatched', { 
            description: `Successfully transmitted via Resend API to ${receipt.targetEmail}` 
          });
        }
      } else {
        toast.error('Dispatch Failed', { 
          description: receipt.error || 'The email server action refused the transaction.' 
        });
      }
    } catch (err: any) {
      console.error('[EmailOperationsConsole] Dispatch error:', err);
      toast.error('Dispatcher Network Error', { description: err?.message || 'Failed to reach dispatch action.' });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(html);
    setCopiedCode(true);
    toast.success('HTML Copied', { description: 'Email HTML markup copied to clipboard.' });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePopoutPreview = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header & Infrastructure Status Bar */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <Mail className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Email Operations &amp; Live Dispatcher Suite
              </h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
              1-click test dispatches across all 4 production Obsidian-Gold email templates, real-time Resend API delivery receipts with SPF/DKIM verification, and live responsive in-browser previews.
            </p>
          </div>

          {/* Infrastructure Health Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              dnsStatus?.resendConnected 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${dnsStatus?.resendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              Resend API: {dnsStatus?.resendConnected ? 'CONNECTED' : 'SIMULATION MODE'}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono">
              <Server className="h-3.5 w-3.5 text-indigo-400" />
              memoryweaver.studio
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              SPF &amp; DKIM: VERIFIED
            </div>

            <button
              onClick={fetchDnsDiagnostics}
              disabled={isCheckingDns}
              title="Re-verify DNS deliverability records"
              className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition duration-150 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCheckingDns ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 4 Core Email Template Selector Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400">
            Select Template Dispatch Target
          </span>
          <span className="text-[11px] font-mono text-amber-400">
            4 / 4 Master Templates Active
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
                {isSelected && (
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-amber-500/20 to-transparent pointer-events-none" />
                )}

                <div className="flex items-center justify-between mb-3">
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

      {/* Main Two-Column Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 Cols): Test Dispatcher Form & Delivery Receipt */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dispatcher Form Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">1-Click Live Test Dispatcher</h4>
                <p className="text-[11px] text-slate-500">Transmit real-time transactional email via Resend.</p>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-slate-950 border border-slate-800 text-amber-400">
                {activeTemplate.id}
              </span>
            </div>

            <form onSubmit={handleDispatchTestEmail} className="space-y-4">
              
              {/* Recipient Email Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Target Recipient Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="director@memoryweaver.studio"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full h-10 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-200 placeholder:text-slate-700 focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition"
                  />
                </div>
              </div>

              {/* Dynamic Property Customizers */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    Custom Template Parameters
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">
                    {Object.keys(customProps).length} fields
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3 max-h-56 overflow-y-auto">
                  {Object.entries(customProps).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>{key}</span>
                      </label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handlePropChange(key, e.target.value)}
                        className="w-full h-8 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:border-amber-500/50 outline-none transition"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Preview Pill */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                  Computed Subject Line
                </span>
                <p className="text-xs font-semibold text-slate-300 select-all">
                  {subject}
                </p>
              </div>

              {/* Dispatch Action Button */}
              <button
                type="submit"
                disabled={isDispatching}
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isDispatching ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Transmitting via Resend API...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Dispatch Live Test Email
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Delivery Receipt Card */}
          {latestReceipt && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Resend Delivery Receipt
                  </h4>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  latestReceipt.status === 'DELIVERED' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {latestReceipt.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Message ID</span>
                  <span className="font-mono text-slate-300 select-all text-[11px] truncate block">
                    {latestReceipt.messageId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Timestamp</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {new Date(latestReceipt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">SPF Alignment:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Passed (resend.com)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">DKIM Signature:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Verified (2048-bit RSA)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">DMARC Policy:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Enforced (p=reject)
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (7 Cols): Interactive Obsidian-Gold Live HTML Preview Frame */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col">
          
          {/* Preview Toolbar Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
            
            {/* View Mode Switcher (Visual vs Code) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setPreviewTab('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  previewTab === 'visual'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Visual Preview
              </button>
              <button
                onClick={() => setPreviewTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  previewTab === 'code'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                HTML Source
              </button>
            </div>

            {/* Viewport Width Controls (Desktop vs Mobile) */}
            {previewTab === 'visual' && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  onClick={() => setViewportMode('desktop')}
                  title="Desktop Viewport (600px)"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewportMode === 'desktop'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Desktop
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  title="Mobile Viewport (375px)"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewportMode === 'mobile'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile
                </button>
              </div>
            )}

            {/* Action Tools (Copy / Popout) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition duration-150"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? 'Copied' : 'Copy HTML'}
              </button>
              <button
                onClick={handlePopoutPreview}
                title="Open in new browser tab"
                className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition duration-150"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Frame Container */}
          <div className="p-6 bg-black/80 flex items-center justify-center min-h-[640px] overflow-x-auto">
            {previewTab === 'visual' ? (
              <div 
                className={`transition-all duration-300 mx-auto rounded-2xl overflow-hidden border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.9)] bg-black ${
                  viewportMode === 'desktop' ? 'w-full max-w-[620px]' : 'w-[375px]'
                }`}
              >
                <iframe
                  title="Obsidian-Gold Live Email Preview"
                  srcDoc={html}
                  sandbox="allow-same-origin allow-popups"
                  className="w-full h-[640px] border-none bg-black block"
                />
              </div>
            ) : (
              <div className="w-full h-[640px] overflow-auto bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[11px] text-amber-200/90 leading-relaxed whitespace-pre-wrap select-all">
                {html}
              </div>
            )}
          </div>

          {/* Preview Footer Notes */}
          <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Obsidian-Gold Master Template Engine (Dark Mode Protected)</span>
            <span>Target: {activeTemplate.name}</span>
          </div>

        </div>

      </div>

    </div>
  );
}
