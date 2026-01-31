
"use client";

import { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';

interface RemoteControlDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
}

export function RemoteControlDialog({ open, onClose, sessionId }: RemoteControlDialogProps) {
  const [guestUrl, setGuestUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!open) {
    return null;
  }

  const remoteUrl = `${window.location.origin}/remote/${sessionId}`;

  const generateGuestLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/guest-access', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to generate guest link.');
      }
      const { token } = await response.json();
      const url = `${remoteUrl}?token=${token}`;
      setGuestUrl(url);
      toast({ title: 'Guest link generated!', description: 'You can now copy the link.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Could not generate guest link.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    if (guestUrl) {
      navigator.clipboard.writeText(guestUrl);
      toast({ title: 'Copied!', description: 'Guest link copied to clipboard.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg">Remote Control</DialogTitle>
          <DialogDescription>
            Scan the QR code or generate a guest link to share.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          <QRCodeCanvas value={guestUrl || remoteUrl} size={256} level={"H"} includeMargin={true} />
        </div>
        {guestUrl ? (
          <div className="flex flex-col gap-2">
            <Input value={guestUrl} readOnly />
            <Button onClick={copyToClipboard}>Copy Link</Button>
          </div>
        ) : (
          <Button onClick={generateGuestLink} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Guest Link'}
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
