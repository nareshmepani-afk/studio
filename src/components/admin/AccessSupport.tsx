'use client';

import React, { useState, useEffect } from 'react';
import { listAdminUsers, toggleAdminUserStatus, inviteAdminUser } from '@/app/admin/actions';
import { retriggerClientOnboardingPassAction } from '@/app/admin/emailActions';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight, 
  Mail,
  UserCheck,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface WhitelistUser {
  email: string;
  isActive: boolean;
  mfaSetupComplete: boolean;
}

export default function AccessSupport() {
  const [users, setUsers] = useState<WhitelistUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [retriggering, setRetriggering] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await listAdminUsers();
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        toast.error('Query Failure', { description: res.message || 'Failed to list admin users.' });
      }
    } catch (err) {
      console.error('[AccessSupport:Query] Error:', err);
      toast.error('Connection Failure', { description: 'Failed to access security gateway.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToInvite = newEmail.trim();
    if (!emailToInvite) return;

    if (!emailToInvite.endsWith('@gmail.com') && !emailToInvite.endsWith('@googlemail.com')) {
      toast.error('Invalid Domain', { description: 'Only @gmail.com or @googlemail.com accounts can be invited.' });
      return;
    }

    setInviting(true);
    try {
      const res = await inviteAdminUser(emailToInvite);
      if (res.success) {
        toast.success('Identity Whitelisted', { description: `${emailToInvite} has been invited.` });
        setNewEmail('');
        await fetchUsers();
      } else {
        toast.error('Invitation Failed', { description: res.message || 'Database transaction refused.' });
      }
    } catch (err) {
      console.error('[AccessSupport:Invite] Error:', err);
      toast.error('Transaction Refused', { description: 'Security write-path failed.' });
    } finally {
      setInviting(false);
    }
  };

  const handleToggle = async (email: string) => {
    setToggling(email);
    try {
      const res = await toggleAdminUserStatus(email);
      if (res.success) {
        toast.success('Status Updated', { description: `Flipped isActive state for ${email}` });
        await fetchUsers();
      } else {
        toast.error('Transaction Failed', { description: res.message || 'Toggle request rejected.' });
      }
    } catch (err) {
      console.error('[AccessSupport:Toggle] Error:', err);
      toast.error('Write Refused', { description: 'Security toggle write-path failed.' });
    } finally {
      setToggling(null);
    }
  };

  const handleRetriggerPass = async (email: string) => {
    setRetriggering(email);
    try {
      const res = await retriggerClientOnboardingPassAction(email);
      if (res.success) {
        toast.success('Onboarding Pass Dispatched', { 
          description: `Welcome Host Pass email delivered to ${email}` 
        });
      } else {
        toast.error('Dispatch Failed', { 
          description: res.error || 'Failed to deliver client onboarding pass.' 
        });
      }
    } catch (err: any) {
      console.error('[AccessSupport:Retrigger] Error:', err);
      toast.error('Dispatch Network Error', { description: err?.message || 'Server action failed.' });
    } finally {
      setRetriggering(null);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Invite Block */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Invite New Identity</h3>
            <p className="text-[11px] text-slate-500">Authorize Google staff accounts to access the admin gateway.</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="flex gap-3">
          <div className="relative flex-1 group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-red-400 transition-colors" />
            <input
              type="email"
              required
              disabled={inviting}
              placeholder="staff.member@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full h-11 bg-slate-950/80 border border-slate-800/80 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-200 placeholder:text-slate-700 focus:ring-1 focus:ring-red-500/20 focus:border-red-500/40 transition-all outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="h-11 px-5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-red-600/10 flex items-center gap-2"
          >
            {inviting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                Add Whitelist
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </section>

      {/* Database Listing Block */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl relative">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Whitelisted Profiles</h3>
              <p className="text-[11px] text-slate-500">Currently registered personnel with active access scopes.</p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-950/50 flex items-center justify-center hover:bg-slate-800 transition duration-200 disabled:opacity-50 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-red-500" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Retrieving Security Whitelist...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No identities whitelisted. Gateway secure by default.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/30 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  <th className="px-6 py-4">Email (Document ID)</th>
                  <th className="px-6 py-4">MFA Enrollment</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map((user) => (
                  <tr key={user.email} className="hover:bg-slate-800/10 transition duration-150">
                    <td className="px-6 py-4 font-semibold text-slate-200 select-all">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.mfaSetupComplete ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          <ShieldCheck className="h-3 w-3" />
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                          <ShieldAlert className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-widest">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRetriggerPass(user.email)}
                          disabled={retriggering !== null || toggling !== null}
                          title="Re-send Welcome Host Pass email"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 hover:bg-amber-500/20 text-[10px] font-bold uppercase tracking-wider transition duration-200 disabled:opacity-50"
                        >
                          {retriggering === user.email ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                          ) : (
                            <Send className="h-3 w-3 text-amber-400" />
                          )}
                          Re-send Pass
                        </button>

                        <button
                          onClick={() => handleToggle(user.email)}
                          disabled={toggling !== null || retriggering !== null}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition duration-200 ${
                            user.isActive
                              ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20'
                              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {toggling === user.email ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : user.isActive ? (
                            <>
                              <ToggleRight className="h-3.5 w-3.5" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-3.5 w-3.5" />
                              Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
