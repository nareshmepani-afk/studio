"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Memory, Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Check, Users, Trash2, Search, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp, where, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
  memory: Memory;
  onClose: () => void;
}

export function ShareDialog({ memory, onClose }: ShareDialogProps) {
  const { user } = useAuth();
  const [storytellerEmail, setStorytellerEmail] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;
    setIsFetchingContacts(true);
    try {
      const contactsRef = collection(db, 'users', user.uid, 'contacts');
      const q = query(contactsRef, orderBy('lastUsedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedContacts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      setContacts(fetchedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setIsFetchingContacts(false);
    }
  };

  const saveOrUpdateContact = async (email: string) => {
    if (!user) return;
    try {
      const contactsRef = collection(db, 'users', user.uid, 'contacts');
      const q = query(contactsRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Add new contact
        await addDoc(contactsRef, {
          email,
          lastUsedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      } else {
        // Update existing contact's lastUsedAt
        const contactDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'users', user.uid, 'contacts', contactDoc.id), {
          lastUsedAt: serverTimestamp()
        });
      }
      fetchContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
    }
  };

  const deleteContact = async (e: React.MouseEvent, contactId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'contacts', contactId));
      setContacts(prev => prev.filter(c => c.id !== contactId));
      toast.success("Contact removed");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to remove contact");
    }
  };

  const handleSendInvite = async () => {
    if (!storytellerEmail) return;
    setIsSendingInvite(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    await saveOrUpdateContact(storytellerEmail);
    
    toast.success("Invite Sent", { 
      description: `Invitation sent to ${storytellerEmail}. Agent Weaver will handle the link delivery.` 
    });
    
    setIsSendingInvite(false);
    setStorytellerEmail('');
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [contacts, searchQuery]);

  const handleGenerateLink = () => {
    const link = `${window.location.origin}/share/${memory.id}`;
    setShareLink(link);
    toast.success("Share link generated!", {
      description: "You can now copy the link to share it.",
    });
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
    } catch (err) {
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
          toast.success("Link copied to clipboard!", {
            description: "Used fallback for compatibility.",
          });
        } else {
          throw new Error('Fallback copy command failed');
        }
      } catch (fallbackErr) {
        console.error("Failed to copy link:", fallbackErr);
        toast.error("Failed to Copy", {
          description: "Could not copy link to clipboard.",
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
            Invite Storytellers to view this memory or generate a shareable link.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="storyteller-email" className="text-sm font-medium">Invite by Email (Optional)</Label>
              {contacts.length > 0 && (
                <button 
                  onClick={() => setShowContacts(!showContacts)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Users className="h-3 w-3" />
                  {showContacts ? "Hide Address Book" : "View Recent"}
                </button>
              )}
            </div>
            
            <div className="relative">
              <Input
                id="storyteller-email"
                type="email"
                placeholder="storyteller@example.com"
                value={storytellerEmail}
                onChange={(e) => setStorytellerEmail(e.target.value)}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Send className={cn("h-4 w-4 transition-colors", storytellerEmail ? "text-primary" : "text-muted-foreground/30")} />
              </div>
            </div>

            {showContacts && (
              <div className="border rounded-lg bg-muted/30 p-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search contacts..." 
                    className="h-8 pl-8 text-xs bg-background" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="max-h-[120px] overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-muted">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <div 
                        key={contact.id}
                        onClick={() => {
                          setStorytellerEmail(contact.email);
                          setShowContacts(false);
                        }}
                        className="flex items-center justify-between p-2 rounded hover:bg-primary/10 cursor-pointer group transition-colors"
                      >
                        <div className="flex flex-col">
                          {contact.name && <span className="text-xs font-semibold">{contact.name}</span>}
                          <span className="text-[10px] text-muted-foreground">{contact.email}</span>
                        </div>
                        <button 
                          onClick={(e) => deleteContact(e, contact.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-center text-muted-foreground py-2 italic">
                      No matching storytellers found.
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button 
              variant="default" 
              className="w-full shadow-sm" 
              onClick={handleSendInvite} 
              disabled={!storytellerEmail || isSendingInvite}
            >
              {isSendingInvite ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Cinematic Invite'
              )}
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
