'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Mail, User, Send, Star, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface GuestRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
  promptTitle: string;
  hostId: string;
}

export function GuestRequestModal({ isOpen, onClose, promptId, promptTitle, hostId }: GuestRequestModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const requestsRef = collection(db, 'users', hostId, 'requests');
      await addDoc(requestsRef, {
        promptId,
        promptTitle,
        guestName: name,
        guestEmail: email,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success("Request Sent!", {
        description: `We've notified the Director that you'd like to see "${promptTitle}".`,
        icon: <Star className="h-4 w-4 text-yellow-500" />
      });
      onClose();
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to send request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-neutral-950 border-amber-500/30 text-white p-6 text-left space-y-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-headline font-bold text-white italic">Protected Story Request</h3>
              <p className="text-[11px] text-amber-300 font-mono">Anti-Bot Protection Active</p>
            </div>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            To protect story directors from automated spam bots, please sign in with your free Guest Access Pass to request <span className="text-white font-bold">"{promptTitle}"</span>.
          </p>
          <Button
            type="button"
            onClick={() => {
              onClose();
              router.push('/login');
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black uppercase text-xs tracking-wider py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Sign In for Free Guest Access</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-neutral-950 border-white/10 text-white overflow-hidden p-0">
        {/* Cinematic Backdrop Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-6 relative z-10">
          <DialogHeader className="mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-px w-8 bg-primary/50" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-black">Coming Soon</span>
            </div>
            <DialogTitle className="text-3xl font-headline italic tracking-tighter">Request this Story</DialogTitle>
            <DialogDescription className="text-white/50 pt-2">
              Enter your details to notify the Director that you'd like to see <span className="text-white font-bold">"{promptTitle}"</span> added to the Cinema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName" className="text-[11px] uppercase tracking-widest text-white/40 font-bold ml-1">Your Name</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="guestName"
                    placeholder="e.g. John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 pl-10 focus:ring-primary focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestEmail" className="text-[11px] uppercase tracking-widest text-white/40 font-bold ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="guestEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 pl-10 focus:ring-primary focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] h-12 rounded-xl group transition-all"
              >
                {isSubmitting ? 'Sending Request...' : 'Send Request'}
                <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
