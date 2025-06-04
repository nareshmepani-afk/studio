
"use client";

import { useState } from 'react';
import type { Memory } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast'; // Changed import
import { Copy, Check } from 'lucide-react';

interface ShareDialogProps {
  memory: Memory;
  onClose: () => void;
}

export function ShareDialog({ memory, onClose }: ShareDialogProps) {
  const [guestEmail, setGuestEmail] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  // const { toast } = useToast(); // Removed useToast() call

  const handleGenerateLink = () => {
    // Mock link generation
    const link = `https://memoryweaver.example.com/share/${memory.id}/${Date.now()}`;
    setShareLink(link);
    toast({ // Direct use of imported toast
      title: "Share link generated!",
      description: "You can now copy the link to share it.",
    });
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ // Direct use
        title: "Link copied to clipboard!",
      });
    }
  };

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
            <Button variant="outline" className="w-full" onClick={() => toast({ title: "Invite Sent (Mock)", description: `Invitation sent to ${guestEmail}.`})} disabled={!guestEmail}>
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
              <Button onClick={handleGenerateLink} className="w-full">
                Generate Secure Link
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

