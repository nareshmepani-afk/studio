
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { QRCodeCanvas } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface RemoteControlDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
}

export function RemoteControlDialog({ open, onClose, sessionId }: RemoteControlDialogProps) {
  const [storytellerUrl, setStorytellerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);



  const { user } = useAuth();
  const [remoteUrl, setRemoteUrl] = useState('');

  useEffect(() => {
    // Prevent SSR hydration mismatch and dynamically build the absolute LAN IP for mobile
    if (typeof window !== 'undefined' && user?.uid) {
      let baseOrigin = window.location.origin;
      setRemoteUrl(`${window.location.protocol}//${window.location.hostname === 'localhost' ? '192.168.1.205' : window.location.hostname}:3000/interviewer/${sessionId}?hostId=${user.uid}`);
    }
  }, [sessionId, user?.uid]);

  const generateStorytellerLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/guest-access', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to generate storyteller link.');
      }
      const { token } = await response.json();
      const url = `${remoteUrl}?token=${token}`;
      setStorytellerUrl(url);
      toast.success('Storyteller link generated!', { description: 'You can now copy the link.' });
    } catch (error) {
      console.error(error);
      toast.error('Error', { description: 'Could not generate storyteller link.' });
    }
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    if (storytellerUrl) {
      navigator.clipboard.writeText(storytellerUrl);
      toast.success('Copied!', { description: 'Storyteller link copied to clipboard.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg">Remote Control</DialogTitle>
          <DialogDescription>
            Scan the QR code or generate a storyteller link to share.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-4 text-center w-full">Scan for Storyteller / Camera</span>
            <QRCodeCanvas value={storytellerUrl || remoteUrl} size={180} level={"H"} includeMargin={true} className="rounded-xl" />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Collaborator Links</span>
              
              {/* Storyteller / Camera Hub */}
              <div className="flex gap-2">
                <Input value={storytellerUrl || "Generate to see link..."} readOnly className="h-10 text-xs bg-black/40 border-white/10 text-white/60" />
                <Button 
                  onClick={storytellerUrl ? copyToClipboard : generateStorytellerLink} 
                  disabled={isLoading}
                  size="sm"
                  className={storytellerUrl ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary"}
                >
                  {isLoading ? '...' : storytellerUrl ? 'Copy' : 'Camera Hub'}
                </Button>
              </div>

              {/* Guest Director Join Link */}
              <div className="flex gap-2">
                 <Input 
                   value={`${typeof window !== 'undefined' ? window.location.origin : ''}/director?sessionId=${sessionId}&mode=guest_director`} 
                   readOnly 
                   className="h-10 text-xs bg-black/40 border-white/10 text-white/60" 
                 />
                 <Button 
                   onClick={() => {
                     const url = `${window.location.origin}/director?sessionId=${sessionId}&mode=guest_director`;
                     navigator.clipboard.writeText(url);
                     toast.success("Guest Director Link Copied!");
                   }}
                   size="sm"
                   className="bg-purple-600 hover:bg-purple-700"
                 >
                   Guest Dir
                 </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
