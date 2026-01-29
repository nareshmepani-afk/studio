
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
import { QRCodeCanvas } from "qrcode.react";

interface RemoteControlDialogProps {
    open: boolean;
    onClose: () => void;
    sessionId: string;
}

export function RemoteControlDialog({ open, onClose, sessionId }: RemoteControlDialogProps) {
    if (!open) {
        return null;
    }

    const remoteUrl = `${window.location.origin}/studio/${sessionId}?role=remote`;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="font-headline text-lg">Remote Control</DialogTitle>
                <DialogDescription>
                Scan this QR code with your phone to open a remote control for the teleprompter.
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
                <QRCodeCanvas value={remoteUrl} size={256} level={"H"} includeMargin={true} />
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
