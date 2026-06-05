'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Activity, ShieldAlert, Cpu, Database, Wifi, RefreshCw, AlertTriangle, Layers, Zap } from 'lucide-react';
import {
  GENKIT_OPTIONS,
  VERTEX_OPTIONS,
  REPLICATE_OPTIONS,
  GENKIT_MODELS,
  VERTEX_MODELS,
  REPLICATE_MODELS,
} from '@/ai/models';
import {
  setDevModelOverride,
  clearDevModelOverrides,
  getDevModelOverrides,
  setDevSimulationOverride,
} from '@/actions/devActions';
import localforage from 'localforage';

export default function DevHUD() {
  // Overrides state
  const [overrides, setOverrides] = useState<{
    genkit: string | null;
    vertex: string | null;
    replicate: string | null;
    simulateTranscoderError: boolean;
    simulateScriptCorruption: boolean;
  }>({
    genkit: null,
    vertex: null,
    replicate: null,
    simulateTranscoderError: false,
    simulateScriptCorruption: false,
  });

  // Telemetry state
  const [latency, setLatency] = useState<number | null>(null);
  const [dbKeysCount, setDbKeysCount] = useState<number>(0);
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number }>({ used: 0, quota: 0 });
  const [p2pSimulatedDrop, setP2pSimulatedDrop] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load active overrides and local storage states
  const refreshConfig = useCallback(async () => {
    try {
      const activeOverrides = await getDevModelOverrides();
      setOverrides(activeOverrides);

      if (typeof window !== 'undefined') {
        setP2pSimulatedDrop(localStorage.getItem('dev_simulate_webrtc_disconnect') === 'true');
        
        // Sync local storage for client-side transcoder simulation check
        if (activeOverrides.simulateTranscoderError) {
          localStorage.setItem('dev_simulate_transcoder_error', 'true');
        } else {
          localStorage.removeItem('dev_simulate_transcoder_error');
        }
      }
    } catch (e) {
      console.error('[DevHUD] Failed to load overrides:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up telemetry updates
  useEffect(() => {
    refreshConfig();

    // 1. Live server latency ping loop
    const pingInterval = setInterval(async () => {
      const startTime = Date.now();
      try {
        const res = await fetch('/api/dev/ping');
        if (res.ok) {
          setLatency(Date.now() - startTime);
        } else {
          setLatency(null);
        }
      } catch (err) {
        setLatency(null);
      }
    }, 2000);

    // 2. Storage and Database Telemetry
    const checkStorage = async () => {
      try {
        const keys = await localforage.keys();
        setDbKeysCount(keys.length);

        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          setStorageUsage({
            used: Math.round((estimate.usage || 0) / 1024 / 1024 * 100) / 100, // MB
            quota: Math.round((estimate.quota || 0) / 1024 / 1024 / 1024 * 10) / 10, // GB
          });
        }
      } catch (e) {
        console.warn('[DevHUD] Storage telemetry error:', e);
      }
    };

    checkStorage();
    const storageInterval = setInterval(checkStorage, 10000);

    return () => {
      clearInterval(pingInterval);
      clearInterval(storageInterval);
    };
  }, [refreshConfig]);

  // Handle model change
  const handleModelChange = async (service: 'genkit' | 'vertex' | 'replicate', value: string) => {
    try {
      await setDevModelOverride(service, value);
      toast.success(`Hot-swapped ${service} to use ${value}`);
      refreshConfig();
    } catch (e: any) {
      toast.error(`Override failed: ${e.message}`);
    }
  };

  // Handle simulation toggle
  const handleSimulationToggle = async (key: 'transcoder_error' | 'script_corruption', checked: boolean) => {
    try {
      await setDevSimulationOverride(key, checked);
      if (key === 'transcoder_error') {
        if (checked) {
          localStorage.setItem('dev_simulate_transcoder_error', 'true');
        } else {
          localStorage.removeItem('dev_simulate_transcoder_error');
        }
      }
      toast.success(`${key.replace('_', ' ').toUpperCase()} simulation ${checked ? 'activated' : 'deactivated'}`);
      refreshConfig();
    } catch (e: any) {
      toast.error(`Toggle failed: ${e.message}`);
    }
  };

  // Toggle P2P Disconnect locally
  const toggleP2PDisconnect = (checked: boolean) => {
    if (typeof window === 'undefined') return;
    if (checked) {
      localStorage.setItem('dev_simulate_webrtc_disconnect', 'true');
    } else {
      localStorage.removeItem('dev_simulate_webrtc_disconnect');
    }
    setP2pSimulatedDrop(checked);
    window.dispatchEvent(new CustomEvent('dev-p2p-simulation-changed'));
    toast.success(`P2P/WebRTC Disconnect simulation ${checked ? 'activated' : 'deactivated'}`);
  };

  // Reset registry
  const handleResetRegistry = async () => {
    try {
      await clearDevModelOverrides();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dev_simulate_webrtc_disconnect');
        localStorage.removeItem('dev_simulate_transcoder_error');
        localStorage.removeItem('dev_simulate_script_corruption');
      }
      setP2pSimulatedDrop(false);
      window.dispatchEvent(new CustomEvent('dev-p2p-simulation-changed'));
      toast.success('Restored default AI model registry and cleared edge cases');
      refreshConfig();
    } catch (e: any) {
      toast.error(`Reset failed: ${e.message}`);
    }
  };

  // Evaluate model health code
  const getModelHealth = (model: string) => {
    const deprecated = ['gemini-1.5-pro-002', 'googleai/gemini-2.0-flash'];
    if (deprecated.includes(model)) {
      return { status: 'DEPRECATED', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    }
    return { status: 'OPERATIONAL', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  };

  const activeGenkit = overrides.genkit || GENKIT_MODELS.FLASH;
  const activeVertex = overrides.vertex || VERTEX_MODELS.PRO;
  const activeReplicate = overrides.replicate || REPLICATE_MODELS.MUSICGEN;

  const genkitHealth = getModelHealth(activeGenkit);
  const vertexHealth = getModelHealth(activeVertex);
  const replicateHealth = getModelHealth(activeReplicate);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
          <span className="text-sm font-medium tracking-widest uppercase">Securing Command Deck...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-neutral-950 to-neutral-950 -z-10 pointer-events-none" />
      
      {/* HUD HEADER */}
      <header className="mb-8 border-b border-white/5 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              LOCALHOST-DEBUG MODE
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            Developer HUD & Control Cockpit
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Centrally registry overrides, state injectors, and live network diagnostics.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetRegistry}
            className="border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-xs font-semibold"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Restore Defaults
          </Button>
        </div>
      </header>

      {/* THREE-COLUMN COMMAND MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: HARDWARE MATRIX & SYSTEM HEALTH */}
        <Card className="bg-neutral-900/40 border-white/5 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-300">
              <Activity className="h-4 w-4 text-amber-500" />
              🛰️ Hardware Matrix & Telemetry
            </CardTitle>
            <CardDescription className="text-[11px] text-neutral-500">
              Live device latency and client-side database diagnostics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-xs">
            {/* Server Ping */}
            <div className="flex justify-between items-center bg-neutral-950/40 p-3 border border-white/5 rounded-lg">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5" /> Server Latency
              </span>
              {latency !== null ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400">{latency}ms</span>
                  <div className={`h-2.5 w-2.5 rounded-full ${latency < 80 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                </div>
              ) : (
                <Badge variant="destructive" className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-mono">
                  OFFLINE
                </Badge>
              )}
            </div>

            {/* P2P Status */}
            <div className="flex justify-between items-center bg-neutral-950/40 p-3 border border-white/5 rounded-lg">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> PeerJS Signaling
              </span>
              {p2pSimulatedDrop ? (
                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-widest">
                  DROP SIMULATED
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">
                  ACTIVE
                </Badge>
              )}
            </div>

            {/* IndexedDB Cache */}
            <div className="space-y-2 bg-neutral-950/40 p-3 border border-white/5 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" /> localForage Telemetry
                </span>
                <span className="font-mono text-neutral-400">{dbKeysCount} Active Keys</span>
              </div>
              <div className="pt-2 border-t border-white/5 mt-1 flex justify-between text-[11px] text-neutral-500">
                <span>IndexedDB Estimate:</span>
                <span>{storageUsage.used} MB used / ~{storageUsage.quota || 'Unlimited'} GB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COLUMN 2: AI MODEL REGISTRY */}
        <Card className="bg-neutral-900/40 border-white/5 backdrop-blur-md relative overflow-hidden lg:col-span-1">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-300">
              <Cpu className="h-4 w-4 text-amber-500" />
              🧠 AI Model Registry (models.ts)
            </CardTitle>
            <CardDescription className="text-[11px] text-neutral-500">
              Auto-updating aliases and hot-swap override controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Genkit Models */}
            <div className="space-y-1.5 p-3.5 rounded-lg border border-white/5 bg-neutral-950/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Genkit (Google AI)</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full ${genkitHealth.color}`}>
                  {genkitHealth.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Select
                  value={activeGenkit}
                  onValueChange={(val) => handleModelChange('genkit', val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-neutral-900 border-neutral-800 text-neutral-200">
                    <SelectValue placeholder="Select Genkit model" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs">
                    {GENKIT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="hover:bg-neutral-800">
                        {opt} {opt === GENKIT_MODELS.FLASH ? '(Default)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vertex AI Models */}
            <div className="space-y-1.5 p-3.5 rounded-lg border border-white/5 bg-neutral-950/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Vertex AI (Cloud SDK)</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full ${vertexHealth.color}`}>
                  {vertexHealth.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Select
                  value={activeVertex}
                  onValueChange={(val) => handleModelChange('vertex', val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-neutral-900 border-neutral-800 text-neutral-200">
                    <SelectValue placeholder="Select Vertex model" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs">
                    {VERTEX_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="hover:bg-neutral-800">
                        {opt} {opt === VERTEX_MODELS.PRO ? '(Default)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Replicate (MusicGen) */}
            <div className="space-y-1.5 p-3.5 rounded-lg border border-white/5 bg-neutral-950/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Replicate (MusicGen)</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full ${replicateHealth.color}`}>
                  {replicateHealth.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Select
                  value={activeReplicate}
                  onValueChange={(val) => handleModelChange('replicate', val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-neutral-900 border-neutral-800 text-neutral-200">
                    <SelectValue placeholder="Select Replicate hash" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs">
                    {REPLICATE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="hover:bg-neutral-800">
                        {opt.substring(0, 8)}...{opt.substring(opt.length - 8)} {opt === REPLICATE_MODELS.MUSICGEN ? '(Default)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* COLUMN 3: STATE SIMULATION & EDGE CASES */}
        <Card className="bg-neutral-900/40 border-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-300">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              🎮 State Injector (Edge Cases)
            </CardTitle>
            <CardDescription className="text-[11px] text-neutral-500">
              Trigger instant simulated network drops or pipeline crashes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* P2P Disconnect */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-neutral-950/20">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-bold text-neutral-200">Simulate P2P / WebRTC Drop</div>
                <div className="text-[10px] text-neutral-500">
                  Instantly disconnect any active remote camera browser sync.
                </div>
              </div>
              <Switch
                checked={p2pSimulatedDrop}
                onCheckedChange={toggleP2PDisconnect}
              />
            </div>

            {/* Script Corruption */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-neutral-950/20">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-bold text-neutral-200">Inject Script Corruption</div>
                <div className="text-[10px] text-neutral-500">
                  Inject metadata noise or corrupt dialogue tokens.
                </div>
              </div>
              <Switch
                checked={overrides.simulateScriptCorruption}
                onCheckedChange={(val) => handleSimulationToggle('script_corruption', val)}
              />
            </div>

            {/* Transcoder Error */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-neutral-950/20">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-bold text-neutral-200">Force Transcoder API Error</div>
                <div className="text-[10px] text-neutral-500">
                  Force the stitching Cloud Function to trigger video compilation failure.
                </div>
              </div>
              <Switch
                checked={overrides.simulateTranscoderError}
                onCheckedChange={(val) => handleSimulationToggle('transcoder_error', val)}
              />
            </div>

          </CardContent>
        </Card>
      </div>

      {/* FOOTER telemetry logs */}
      <footer className="mt-8 border-t border-white/5 pt-6 text-center text-[10px] font-mono text-neutral-600">
        CONSOLE TELEMETRY // AI MODEL REGISTRY MIGRATED // CONTROL COCKPIT ONLINE
      </footer>
    </div>
  );
}
