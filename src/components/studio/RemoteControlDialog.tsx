
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
        <div className="flex items-center justify-center p-4">
          <QRCodeCanvas value={storytellerUrl || remoteUrl} size={256} level={"H"} includeMargin={true} />
        </div>
        {storytellerUrl ? (
          <div className="flex flex-col gap-2">
            <Input value={storytellerUrl} readOnly />
            <Button onClick={copyToClipboard}>Copy Link</Button>
          </div>
        ) : (
          <Button onClick={generateStorytellerLink} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Storyteller Link'}
          </Button>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
