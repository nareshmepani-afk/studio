'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { verifyAdminCredentials } from '@/app/admin/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Key, 
  Lock, 
  LogIn, 
  ShieldAlert, 
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminFooter } from '@/app/admin/components/AdminFooter';

export default function AdminLoginContent() {
  const router = useRouter();
  const [step, setStep] = useState<'google' | 'mfa' | 'denied'>('google');
  const [loading, setLoading] = useState(false);
  const [totpToken, setTotpToken] = useState('');
  const [tempGoogleToken, setTempGoogleToken] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle redirect result extraction on mount
  useEffect(() => {
    let active = true;
    
    setLoading(true);
    getRedirectResult(auth)
      .then(async (userCredential) => {
        if (!active) return;
        if (!userCredential) {
          setLoading(false);
          return;
        }

        const idToken = await userCredential.user.getIdToken(true);
        const result = await verifyAdminCredentials(idToken);
        
        if (!result.success) {
          setErrorMessage(result.message || 'Access Denied.');
          setStep('denied');
          toast.error('Admin Access Denied', { description: result.message });
          setLoading(false);
          return;
        }
        
        setAdminEmail(result.email || '');
        
        if (result.requiresMfa) {
          setTempGoogleToken(idToken);
          setStep('mfa');
          toast.info('Multi-Factor Authentication Required', { description: 'Please enter your 6-digit TOTP key.' });
        } else {
          toast.success('Access Granted', { description: `Logged in as ${result.email}` });
          window.location.href = '/admin';
        }
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        console.error('[AdminLogin:RedirectResult] Error:', error);
        setErrorMessage(error?.message || 'Redirect authentication failed.');
        setStep('denied');
        setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const provider = new GoogleAuthProvider();
      // Use signInWithRedirect instead of signInWithPopup to bypass COOP constraints
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error('[AdminLogin] Redirection initiation error:', error);
      setErrorMessage(error?.message || 'Failed to initiate redirect sign-in.');
      setStep('denied');
      toast.error('Authentication Error', {
        description: error?.message || 'Failed to initiate redirect.'
      });
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpToken.length !== 6 || !/^\d+$/.test(totpToken)) {
      toast.error('Invalid Code', { description: 'Please enter a 6-digit numerical key.' });
      return;
    }
    
    setLoading(true);
    try {
      const result = await verifyAdminCredentials(tempGoogleToken, totpToken);
      
      if (result.success) {
        toast.success('Access Granted', {
          description: `MFA validation complete for ${result.email}`
        });
        window.location.href = '/admin';
      } else {
        toast.error('MFA Failed', {
          description: result.message || 'Invalid passcode.'
        });
      }
    } catch (error: any) {
      console.error('[AdminLogin:MFA] Error:', error);
      toast.error('MFA Transaction Error', {
        description: 'Failed to verify secure TOTP handshake.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Grid & Ambient Blur */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        
        {/* Brand / Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/20 border border-indigo-400/20 mb-2">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Memory Weaver Admin Control Center
          </h1>
          <p className="text-indigo-400/80 text-xs font-semibold uppercase tracking-[0.2em]">Security Gateway Authorization</p>
        </div>

        {/* Dynamic State Box */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {step === 'google' && (
              <motion.div
                key="google"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-bold text-slate-200">Whitelisted Staff Identity</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verify credentials via Google Workspace to evaluate access routing rules.
                  </p>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 h-12 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-100 transition duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-white/5 active:scale-[0.98]"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-slate-600" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  Google Identity Pass
                </button>
              </motion.div>
            )}

            {step === 'mfa' && (
              <motion.div
                key="mfa"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Key className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-200">TOTP Key Handshake</h2>
                  <p className="text-xs text-slate-400">
                    Enter the code from your Google Authenticator app for <strong className="text-indigo-300">{adminEmail}</strong>.
                  </p>
                </div>

                <form onSubmit={handleMfaSubmit} className="space-y-4">
                  <div className="relative group/input">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-10 h-12 text-center text-lg font-bold tracking-[0.4em] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-white placeholder:text-slate-700 transition-all outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <>
                        Confirm Authentication
                        <LogIn className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'denied' && (
              <motion.div
                key="denied"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-2">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-rose-400">Access Refused</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    {errorMessage || 'Your Google account is not whitelisted. Access logs are captured in trace telemetry.'}
                  </p>
                </div>

                <button
                  onClick={() => setStep('google')}
                  className="w-full h-11 border border-slate-800 hover:bg-slate-800/50 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200"
                >
                  Return to Gateway
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AdminFooter />

      </div>
    </div>
  );
}
