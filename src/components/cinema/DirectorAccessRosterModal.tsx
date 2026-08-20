'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getMemoryAudienceRosterAction, revokeMemoryAccessAction, type CollaboratorProfile } from '@/actions/memoryActions';
import { Users, UserX, Copy, Check, ShieldCheck, Film, Loader2, Calendar, Mail, User, Share2, QrCode } from 'lucide-react';
import { CinemaShareModal } from './CinemaShareModal';
import { toast } from 'sonner';
import type { Memory } from '@/types';
import { format } from 'date-fns';

interface DirectorAccessRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
  onRosterUpdate?: (memoryId: string, newCount: number) => void;
}

export function DirectorAccessRosterModal({
  isOpen,
  onClose,
  memory,
  onRosterUpdate
}: DirectorAccessRosterModalProps) {
  const { user } = useAuth();
  const [roster, setRoster] = useState<CollaboratorProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [revokingUid, setRevokingUid] = useState<string | null>(null);
  const [confirmRevokeUid, setConfirmRevokeUid] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !memory?.id) {
      setRoster([]);
      setConfirmRevokeUid(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getMemoryAudienceRosterAction(memory.id, user?.uid)
      .then(res => {
        if (!isMounted) return;
        if (res.success && res.roster) {
          setRoster(res.roster);
        } else {
          toast.error(res.error || 'Failed to load audience roster.');
        }
      })
      .catch(err => {
        console.error('[DirectorAccessRosterModal] Fetch error:', err);
        if (isMounted) toast.error('Failed to load audience roster.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, memory?.id, user?.uid]);

  const handleCopyShareLink = async () => {
    if (!memory?.id) return;
    const link = `${window.location.origin}/cinema?id=${memory.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success('Screening link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      toast.error('Could not copy link to clipboard.');
    }
  };

  const handleRevoke = async (collaborator: CollaboratorProfile) => {
    if (!memory?.id || !collaborator.uid) return;

    setRevokingUid(collaborator.uid);
    try {
      const res = await revokeMemoryAccessAction(memory.id, collaborator.uid, user?.uid);
      if (res.success) {
        const updatedRoster = roster.filter(c => c.uid !== collaborator.uid);
        setRoster(updatedRoster);
        setConfirmRevokeUid(null);
        toast.success(`Access revoked for ${collaborator.displayName || collaborator.email || 'collaborator'}.`);
        
        // Synchronously notify parent card to decrement the count
        if (onRosterUpdate) {
          onRosterUpdate(memory.id, updatedRoster.length);
        }
      } else {
        toast.error(res.message || 'Failed to revoke access.');
      }
    } catch (err: any) {
      console.error('[DirectorAccessRosterModal] Revoke error:', err);
      toast.error(err?.message || 'Failed to revoke access.');
    } finally {
      setRevokingUid(null);
    }
  };

  if (!memory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-slate-950/95 border border-white/10 text-white rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Director's Access Governance</span>
          </div>
          <DialogTitle className="text-xl font-bold font-headline text-white tracking-wide">
            Audience & Access Roster
          </DialogTitle>
          <DialogDescription className="text-xs text-white/60 font-mono">
            Manage who has claimed access to <span className="text-amber-300 font-bold">"{memory.title || 'Untitled Memory'}"</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Story Quick Info & Share Link Bar */}
        <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-14 rounded-lg bg-slate-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
              {memory.posterImageUrl || memory.imageUrl ? (
                <img src={memory.posterImageUrl || memory.imageUrl} alt={memory.title} className="w-full h-full object-cover" />
              ) : (
                <Film className="w-4 h-4 text-white/30" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-mono text-amber-400/80 uppercase tracking-widest block truncate">
                {memory.chapterTitle || 'Family Archive'}
              </span>
              <h4 className="text-sm font-bold text-white truncate">{memory.title}</h4>
              <span className="text-[10px] font-mono text-white/40">
                {roster.length} {roster.length === 1 ? 'Collaborator' : 'Collaborators'} with access
              </span>
            </div>
          </div>

          <Button
            onClick={() => setIsShareModalOpen(true)}
            variant="outline"
            size="sm"
            className="shrink-0 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-mono rounded-xl h-9 gap-1.5 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Share & QR Code</span>
          </Button>
        </div>

        {/* Collaborators List */}
        <div className="mt-5 space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider">Loading audience roster...</span>
            </div>
          ) : roster.length === 0 ? (
            <div className="py-10 px-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-3">
              <Users className="w-8 h-8 text-white/20 mx-auto" />
              <p className="text-xs font-mono text-white/60">No collaborators have claimed access yet.</p>
              <p className="text-[10px] font-mono text-white/40 max-w-xs mx-auto leading-relaxed">
                Share your screening link with family members or friends. When they claim it, their name and email will appear here.
              </p>
              <Button
                onClick={() => setIsShareModalOpen(true)}
                variant="outline"
                size="sm"
                className="mt-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-xs rounded-xl h-9 gap-1.5 transition-all cursor-pointer shadow-lg"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-950" />
                <span>Open Share & QR Portal</span>
              </Button>
            </div>
          ) : (
            roster.map((collaborator) => {
              const isConfirming = confirmRevokeUid === collaborator.uid;
              const isRevoking = revokingUid === collaborator.uid;

              return (
                <div
                  key={collaborator.uid}
                  className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 transition-all flex items-center justify-between gap-3 group"
                >
                  {/* Collaborator Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-300 font-mono shrink-0">
                      {collaborator.displayName ? collaborator.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {collaborator.displayName || 'Family Collaborator'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 uppercase tracking-widest shrink-0">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-white/50 truncate">
                        <Mail className="w-3 h-3 text-white/30 shrink-0" />
                        <span className="truncate">{collaborator.email || 'No email provided'}</span>
                      </div>
                      {collaborator.claimedAt && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono text-white/30">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>
                            Claimed {(() => {
                              try {
                                return format(new Date(collaborator.claimedAt), 'dd MMM yyyy, HH:mm');
                              } catch {
                                return collaborator.claimedAt;
                              }
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Revoke Action */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={() => handleRevoke(collaborator)}
                          disabled={isRevoking}
                          size="sm"
                          className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-mono font-bold rounded-xl h-8 px-3 gap-1 shadow-lg"
                        >
                          {isRevoking ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                          <span>Confirm</span>
                        </Button>
                        <Button
                          onClick={() => setConfirmRevokeUid(null)}
                          disabled={isRevoking}
                          variant="ghost"
                          size="sm"
                          className="text-white/40 hover:text-white text-[11px] font-mono rounded-xl h-8 px-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setConfirmRevokeUid(collaborator.uid)}
                        variant="ghost"
                        size="sm"
                        className="text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-xs font-mono rounded-xl h-8 px-2.5 gap-1.5 transition-all"
                        title="Revoke screening access"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Revoke</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
          <span>Revoking access takes effect immediately.</span>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/5 font-mono text-xs rounded-xl"
          >
            Close
          </Button>
        </div>

      </DialogContent>

      {/* Multi-Channel Share & QR Code Portal Modal */}
      <CinemaShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        memory={memory} 
      />
    </Dialog>
  );
}
