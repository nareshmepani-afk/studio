
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import QRCode from "qrcode.react";

interface QrCodeDialogProps {
    open: boolean;
    url: string;
    title: string;
    onClose: () => void;
}

export function QrCodeDialog({ open, url, title, onClose }: QrCodeDialogProps) {
    if (!open) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="font-headline text-lg">Scan to View Prompt</DialogTitle>
                <DialogDescription>
                An interviewer can scan this QR code with their phone to open a webpage with the teleprompter script for the prompt: <strong>{title}</strong>
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
                {/* The QRCode component is the one that needs to be client-side only */}
                <QRCode value={url} size={256} level={"H"} includeMargin={true} />
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
