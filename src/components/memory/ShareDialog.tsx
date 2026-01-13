
"use client";

import { useState, useEffect } from 'react';
import type { Memory } from '@/types.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Copy, Check } from 'lucide-react';

interface ShareDialogProps {
  memory: Memory;
  onClose: () => void;
}

export function ShareDialog({ memory, onClose }: ShareDialogProps) {
  const [guestEmail, setGuestEmail] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGenerateLink = () => {
    const link = `${window.location.origin}/share/${memory.id}`;
    setShareLink(link);
    toast({
      title: "Share link generated!",
      description: "You can now copy the link to share it.",
      variant: "success",
    });
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      // Modern async API. Fails on insecure origins (http).
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({ title: "Link copied to clipboard!", variant: "success" });
    } catch (err) {
      // Fallback for insecure contexts.
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareLink;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          toast({
            title: "Link copied to clipboard!",
            description: "Used fallback for compatibility.",
            variant: "success",
          });
        } else {
          throw new Error('Fallback copy command failed');
        }
      } catch (fallbackErr) {
        console.error("Failed to copy link:", fallbackErr);
        toast({
          title: "Failed to Copy",
          description: "Could not copy link to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Share '{memory.title}'</DialogTitle>
          <DialogDescription>
            Invite guests to view this memory or generate a shareable link.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="guest-email">Invite by Email (Optional)</Label>
            <Input
              id="guest-email"
              type="email"
              placeholder="guest@example.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
            <Button variant="outline" className="w-full" onClick={() => toast({ title: "Invite Sent (Mock)", description: `Invitation sent to ${guestEmail}.`, variant: "success"})} disabled={!guestEmail}>
              Send Invite (Mock)
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="share-link">Shareable Link</Label>
            {shareLink ? (
              <div className="flex items-center space-x-2">
                <Input id="share-link" value={shareLink} readOnly className="flex-grow" />
                <Button type="button" size="icon" variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerateLink} className="w-full" disabled={!isClient}>
                {isClient ? 'Generate Secure Link' : 'Loading...'}
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
