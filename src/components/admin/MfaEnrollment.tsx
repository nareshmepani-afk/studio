'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { generateMfaSetupDetails, verifyAndEnrollMfa } from '@/app/admin/actions';
import { 
  ShieldAlert, 
  Key, 
  Lock, 
  CheckCircle2, 
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function MfaEnrollment() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpauthUri, setOtpauthUri] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadMfaDetails() {
      try {
        const res = await generateMfaSetupDetails();
        if (res.success && res.secret && res.otpauthUri && res.email) {
          setSecret(res.secret);
          setOtpauthUri(res.otpauthUri);
          setEmail(res.email);
        } else {
          setErrorMsg(res.message || 'MFA initialization failure.');
        }
      } catch (err) {
        console.error('[MFASETUP] Load error:', err);
        setErrorMsg('Failed to establish security handshake.');
      } finally {
        setLoading(false);
      }
    }
    loadMfaDetails();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6 || !/^\d+$/.test(token)) {
      toast.error('Invalid Format', { description: 'Please enter a 6-digit numerical token.' });
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyAndEnrollMfa(secret, token);
      if (res.success) {
        toast.success('MFA Setup Complete', {
          description: 'Your security key has been successfully registered.'
        });
        router.push('/admin');
      } else {
        toast.error('Verification Failed', {
          description: res.message || 'The entered code was incorrect.'
        });
      }
    } catch (err: any) {
      console.error('[MFASETUP:Verify] Error:', err);
      toast.error('Transaction Error', {
        description: 'Failed to complete security key registration.'
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Establishing Secure Channel...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/40 border border-red-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6">
          <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-red-400">Security Gateway Failure</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full h-11 border border-slate-800 hover:bg-slate-800/50 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 shadow-xl shadow-red-500/20 border border-red-400/20 mb-2">
            <Key className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            MFA Enrollment
          </h1>
          <p className="text-red-400/80 text-xs font-semibold uppercase tracking-[0.2em]">Secure Staff Key Activation</p>
        </div>

        <div className="bg-slate-900/40 border border-red-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-400">
              Enrolling Multi-Factor Authentication for <strong className="text-red-300">{email}</strong>.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            {otpauthUri && (
              <div className="p-3 bg-white rounded-xl shadow-inner">
                <QRCodeCanvas value={otpauthUri} size={180} level="H" />
              </div>
            )}
            <div className="text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Manual Entry Secret Key</span>
              <code className="block text-sm font-mono text-amber-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 select-all">{secret}</code>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative group/input">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-red-400 transition-colors" />
              <input
                type="text"
                maxLength={6}
                required
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                disabled={verifying}
                className="w-full bg-slate-950 border border-red-500/20 rounded-xl pl-10 h-12 text-center text-lg font-bold tracking-[0.4em] focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 text-white placeholder:text-slate-800 transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 h-12 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-lg shadow-red-600/10"
            >
              {verifying ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  Verify and Activate
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
