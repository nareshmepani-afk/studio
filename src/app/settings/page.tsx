"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { User } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/lib/constants'; 
import { Loader2, UploadCloud, Camera, ShieldCheck, CalendarClock, Gift, ShoppingCart, Info, UserCircle2, HardDrive, Star, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, type FormEvent, useRef, useMemo, useCallback } from 'react';
import { format, isValid, parseISO, getYear, getMonth, getDate, getDaysInMonth, addMonths, addDays, isBefore } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { useRouter } from 'next/navigation'; 
import { app } from '@/lib/firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getPassPriceAction } from '@/actions/getPassPriceAction';
import { getHostPassPriceAction } from '@/actions/getHostPassPriceAction';
import type { GetPassPriceOutput } from '@/ai/flows/get-pass-price-flow';
import type { GetHostPassPriceOutput } from '@/ai/flows/get-host-pass-price-flow';

const currentGlobalYear = new Date().getFullYear();
const dobYears: number[] = Array.from({ length: 120 }, (_, i) => currentGlobalYear - i); 
const dobMonths: { value: number; label: string }[] = Array.from({ length: 12 }, (_, i) => ({
  value: i, 
  label: format(new Date(2000, i, 1), 'MMMM', { locale: enGB }),
}));

export default function SettingsPage() {
  const { 
    user, 
    updateUserProfileInFirestore, 
    loading: authLoading, 
    hostPassStatus, 
    storageQuotaBytes, 
  } = useAuth();
  const router = useRouter(); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [dobYear, setDobYear] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>(''); 
  const [dobDay, setDobDay] = useState<string>('');

  const [countryOfBirth, setCountryOfBirth] = useState('');
  const [city, setCity] = useState('');
  const [townArea, setTownArea] = useState('');
  
  const [guestPassPriceDetails, setGuestPassPriceDetails] = useState<GetPassPriceOutput | null>(null);
  const [isFetchingGuestPassPrice, setIsFetchingGuestPassPrice] = useState(false);
  const [hostPassPriceDetails, setHostPassPriceDetails] = useState<GetHostPassPriceOutput | null>(null);
  const [isFetchingHostPassPrice, setIsFetchingHostPassPrice] = useState(false);

  const daysInSelectedDobMonth = useMemo(() => {
    if (dobYear && dobMonth) {
      const yearNum = parseInt(dobYear);
      const monthNum = parseInt(dobMonth); 
      if (!isNaN(yearNum) && !isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
        return getDaysInMonth(new Date(yearNum, monthNum));
      }
    }
    return 31; 
  }, [dobYear, dobMonth]);

  const dobDayOptions = useMemo(() => {
    return Array.from({ length: daysInSelectedDobMonth }, (_, i) => (i + 1).toString());
  }, [daysInSelectedDobMonth]);

  useEffect(() => {
    if (user) {
      setName(user.name || user.displayName || '');
      setEmail(user.email || '');
      setAvatarPreviewUrl(user.avatarUrl || user.photoURL || null);

      if (user.dateOfBirth && isValid(parseISO(user.dateOfBirth))) {
        const dob = parseISO(user.dateOfBirth);
        setDobYear(getYear(dob).toString());
        setDobMonth(getMonth(dob).toString()); 
        setDobDay(getDate(dob).toString());
      } else { setDobYear(''); setDobMonth(''); setDobDay(''); }

      setCountryOfBirth(user.countryOfBirth || '');
      setCity(user.city || '');
      setTownArea(user.townArea || '');
    }
  }, [user]); 

  useEffect(() => { if (dobDay && parseInt(dobDay) > daysInSelectedDobMonth) setDobDay(daysInSelectedDobMonth.toString()); }, [dobDay, daysInSelectedDobMonth]);

    const fetchGuestPassPrice = useCallback(async () => {
        if (isFetchingGuestPassPrice || guestPassPriceDetails || !user) return;
        setIsFetchingGuestPassPrice(true);
        try {
            const priceData = await getPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' });
            setGuestPassPriceDetails(priceData);
        } catch (error) {
            console.error("SettingsPage: Failed to fetch GUEST pass price:", error);
        } finally { setIsFetchingGuestPassPrice(false); }
    }, [isFetchingGuestPassPrice, guestPassPriceDetails, user]);

    const fetchHostPassPrice = useCallback(async () => {
        if (isFetchingHostPassPrice || hostPassPriceDetails || !user) return;
        setIsFetchingHostPassPrice(true);
        try {
            const priceData = await getHostPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' });
            setHostPassPriceDetails(priceData);
        } catch (error) {
            console.error("SettingsPage: Failed to fetch HOST pass price:", error);
        } finally { setIsFetchingHostPassPrice(false); }
    }, [isFetchingHostPassPrice, hostPassPriceDetails, user]);

    useEffect(() => {
        if (user && (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired')) {
            fetchGuestPassPrice();
        }
        if (user && (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired')) {
            fetchHostPassPrice();
        }
    }, [user, hostPassStatus, fetchGuestPassPrice, fetchHostPassPrice]);


  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) { 
        toast({ title: "Avatar Too Large", description: "Please choose an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreviewUrl(previewUrl);
    }
  };

  const handleTakePhoto = () => {
    toast({ title: "Feature Coming Soon", description: "Webcam photo capture will be implemented." });
  };

    const activateFreeGuestPass = useCallback(async () => {
        if (user && user.sharedAccessStatus === 'no_pass_initiated') {
        const now = new Date();
        await updateUserProfileInFirestore({ sharedAccessStatus: 'free_pass_active', freePassActivatedDate: now.toISOString() });
        toast({ title: "Free Guest Pass Activated!", description: `Your 6-month free access starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000, variant: "success" });
        }
    }, [user, updateUserProfileInFirestore]);

    const purchasePaidGuestPass = useCallback(async () => {
        if (user) {
            const now = new Date(); let startDate = now;
            if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) { startDate = parseISO(user.paidPassExpiryDate); }
            const newExpiryDate = addDays(startDate, 31);
            await updateUserProfileInFirestore({ sharedAccessStatus: 'paid_pass_active', paidPassExpiryDate: newExpiryDate.toISOString() });
            toast({ title: "Guest Pass Activated (Payment Simulated)!", description: `Your 31-day pass is active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000, variant: "success" });
        }
    }, [user, updateUserProfileInFirestore]);

    const activateFreeHostPass = useCallback(async () => {
        if (user && user.hostPassStatus === 'no_pass_initiated') {
        const now = new Date();
        await updateUserProfileInFirestore({ hostPassStatus: 'free_host_pass_active', freeHostPassActivatedDate: now.toISOString() });
        toast({ title: "Free Host Pass Activated!", description: `Your 6-month free host pass starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000, variant: "success" });
        }
    }, [user, updateUserProfileInFirestore]);

    const purchasePaidHostPass = useCallback(async () => {
        if (user) {
        const now = new Date(); let startDate = now;
        if (user.hostPassStatus === 'paid_host_pass_active' && user.paidHostPassExpiryDate && isBefore(now, parseISO(user.paidHostPassExpiryDate))) { startDate = parseISO(user.paidHostPassExpiryDate); }
        const newExpiryDate = addDays(startDate, 31);
        await updateUserProfileInFirestore({ hostPassStatus: 'paid_host_pass_active', paidHostPassExpiryDate: newExpiryDate.toISOString() });
        toast({ title: "Host Pass Activated (Payment Simulated)!", description: `Your 31-day host pass is active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000, variant: "success" });
        }
    }, [user, updateUserProfileInFirestore]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    // FIX: Added non-null assertion to app
    const storage = getStorage(app!);

    let finalAvatarUrlToSave = user.avatarUrl;
    const oldAvatarUrl = user.avatarUrl;

    if (avatarFile) {
      const avatarStoragePath = `avatars/${user.uid}/${Date.now()}-${avatarFile.name}`;
      const fileRef = storageRef(storage, avatarStoragePath);
      try {
        await uploadBytes(fileRef, avatarFile);
        finalAvatarUrlToSave = await getDownloadURL(fileRef);

        if (oldAvatarUrl && oldAvatarUrl !== finalAvatarUrlToSave && oldAvatarUrl.includes('firebasestorage.googleapis.com')) {
          try {
            const oldFileRef = storageRef(storage, oldAvatarUrl);
            await deleteObject(oldFileRef);
          } catch (deleteError: any) {
            if (deleteError.code !== 'storage/object-not-found') {
                 console.warn("Could not delete old avatar from storage:", deleteError);
            }
          }
        }
      } catch (error) {
        console.error("Error uploading avatar:", error);
        toast({ title: "Avatar Upload Failed", description: "Could not save your new avatar. Please try again.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    } else if (avatarPreviewUrl === null && oldAvatarUrl) { 
        finalAvatarUrlToSave = undefined;
        if (oldAvatarUrl.includes('firebasestorage.googleapis.com')) {
             try {
                const oldFileRef = storageRef(storage, oldAvatarUrl);
                await deleteObject(oldFileRef);
            } catch (deleteError: any) {
                if (deleteError.code !== 'storage/object-not-found') {
                    console.warn("Could not delete old avatar from storage during clearing:", deleteError);
                }
            }
        }
    }

    let finalDateOfBirth: string | undefined = undefined;
    if (dobYear && dobMonth && dobDay) {
      const yearNum = parseInt(dobYear); const monthNum = parseInt(dobMonth); const dayNum = parseInt(dobDay);
      if (!isNaN(yearNum) && !isNaN(monthNum) && !isNaN(dayNum)) {
        const dobDate = new Date(yearNum, monthNum, dayNum);
        if (isValid(dobDate) && getYear(dobDate) === yearNum && getMonth(dobDate) === monthNum && getDate(dobDate) === dayNum) {
          finalDateOfBirth = dobDate.toISOString();
        } else {
          toast({ title: "Invalid Date of Birth", variant: "destructive" }); setIsSubmitting(false); return;
        }
      }
    }
    
    const updatedUserDetails: Partial<User> = {
      name: name,
      avatarUrl: finalAvatarUrlToSave, 
      dateOfBirth: finalDateOfBirth, 
      countryOfBirth: countryOfBirth || undefined, 
      city: city || undefined, 
      townArea: townArea || undefined,
    };
    
    try {
        await updateUserProfileInFirestore(updatedUserDetails);
        toast({ title: "Settings Saved!", description: "Your profile information has been updated.", variant: "success" });
        setAvatarFile(null);
    } catch (error) {
        console.error("Error saving settings:", error);
        toast({ title: "Save Failed", description: "Could not update your settings.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  useEffect(() => { 
    let currentPreview = avatarPreviewUrl; 
    return () => { 
      if (currentPreview && currentPreview.startsWith('blob:') && currentPreview !== user?.avatarUrl) {
        URL.revokeObjectURL(currentPreview); 
      }
    }; 
  }, [avatarPreviewUrl, user?.avatarUrl]);


  if (authLoading) return (<AuthenticatedPageWrapper><div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><h2 className="text-2xl font-headline mb-2">Loading Settings...</h2></div></AuthenticatedPageWrapper>);
  if (!user) return (<AuthenticatedPageWrapper><div className="container mx-auto py-8 px-4 text-center"><p>Please log in.</p><Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button></div></AuthenticatedPageWrapper>);
  
  const isEffectivelyEmptyOrPlaceholderAvatar = (url?: string | null): boolean => (!url || url.trim() === '' || url.startsWith('https://avatar.vercel.sh/'));
  let imageSrcForDisplay: string | undefined = avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:') ? avatarPreviewUrl : (avatarPreviewUrl && !isEffectivelyEmptyOrPlaceholderAvatar(avatarPreviewUrl) ? avatarPreviewUrl : undefined);
  let showIconAsFallback = !imageSrcForDisplay;

  const renderGuestPurchaseButton = () => {
    let buttonText = "Purchase 31-Day Guest Pass";
    if (isFetchingGuestPassPrice) {
        buttonText = "Fetching price...";
    } else if (guestPassPriceDetails) {
        buttonText += ` (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.passPrice)})`;
    } else {
         buttonText += ` (price unavailable)`;
    }
    
    const button = (<Button onClick={purchasePaidGuestPass} variant="outline" size="sm" disabled={isFetchingGuestPassPrice}>{isFetchingGuestPassPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}{buttonText}</Button>);
    
    if (guestPassPriceDetails && !isFetchingGuestPassPrice && guestPassPriceDetails.justification) {
       return (<TooltipProvider><div className="flex flex-col items-start space-y-1">{button}<Tooltip><TooltipTrigger asChild><span className="text-xs text-muted-foreground flex items-center cursor-default mt-1"><Info className="h-3 w-3 mr-1" /> {guestPassPriceDetails.justification}</span></TooltipTrigger><TooltipContent align="start" className="max-w-xs"><p>{guestPassPriceDetails.justification} (Based on avg coffee: ~{new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.coffeePrice)})</p></TooltipContent></Tooltip></div></TooltipProvider>);
    }
    return button;
  };
  
  const renderGuestPassStatusInfo = () => {
    if (!user) return null;
    let statusText = ""; let actionContent = null;
    switch (user.sharedAccessStatus) {
        case 'no_pass_initiated': 
            statusText = "Activate your free guest pass for viewing shared memories."; 
            actionContent = (<Button onClick={activateFreeGuestPass} variant="outline" size="sm"><Gift className="mr-2 h-4 w-4" /> Activate 6-Month Free Guest Pass</Button>); 
            break;
        case 'free_pass_active': 
            const fpExp = user.freePassActivatedDate ? format(addMonths(parseISO(user.freePassActivatedDate), 6), 'PPP', { locale: enGB }) : 'N/A'; 
            statusText = `Your 6-month free guest pass is active until ${fpExp}.`; 
            break;
        case 'paid_pass_active': 
            const ppExp = user.paidPassExpiryDate ? format(parseISO(user.paidPassExpiryDate), 'PPP', { locale: enGB }) : 'N/A'; 
            statusText = `Your paid guest pass is active until ${ppExp}.`; 
            actionContent = renderGuestPurchaseButton(); 
            break;
        case 'free_pass_expired': 
        case 'paid_pass_expired': 
            statusText = "Your guest pass has expired."; 
            actionContent = renderGuestPurchaseButton(); 
            break;
        default: statusText = "Guest pass status unknown.";
    }
    return (<div className="mt-2 space-y-2"><p className="text-sm text-muted-foreground">{statusText}</p>{actionContent}</div>);
  };

  const renderHostPurchaseButton = () => {
    let buttonText = "Purchase 31-Day Host Pass";
    if (isFetchingHostPassPrice) { 
        buttonText = "Fetching price...";
    } else if (hostPassPriceDetails) {
        buttonText += ` (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.passPrice)})`;
    } else {
         buttonText += ` (price unavailable)`; 
    }

    const button = (<Button onClick={purchasePaidHostPass} variant="default" size="sm" disabled={isFetchingHostPassPrice}>{isFetchingHostPassPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}{buttonText}</Button>);
    
    if (hostPassPriceDetails && !isFetchingHostPassPrice && hostPassPriceDetails.justification) { 
       return (<TooltipProvider><div className="flex flex-col items-start space-y-1">{button}<Tooltip><TooltipTrigger asChild><span className="text-xs text-muted-foreground flex items-center cursor-default mt-1"><Info className="h-3 w-3 mr-1" /> {hostPassPriceDetails.justification}</span></TooltipTrigger><TooltipContent align="start" className="max-w-xs"><p>{hostPassPriceDetails.justification} (Based on avg coffee: ~{new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.coffeePrice)})</p></TooltipContent></Tooltip></div></TooltipProvider>);
    }
    return button;
  };

  const renderHostPassStatusInfo = () => {
    if (!user) return null;
    let statusText = ""; let actionContent = null;
    let currentPriceString = "";
    if (hostPassPriceDetails && !isFetchingHostPassPrice) { 
        currentPriceString = ` (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.passPrice)})`;
    } else if (isFetchingHostPassPrice) {
        currentPriceString = "(fetching price...)";
    } else {
         currentPriceString = "(price unavailable)"; 
    }

    switch (hostPassStatus) { 
        case 'no_pass_initiated': 
          statusText = "Activate your free host pass to begin creating memories and access all features."; 
          actionContent = (<Button onClick={activateFreeHostPass} variant="default" size="sm"><Star className="mr-2 h-4 w-4" /> Activate 6-Month Free Host Pass</Button>); 
          break;
        case 'free_host_pass_active': 
          const fhpExp = user.freeHostPassActivatedDate ? format(addMonths(parseISO(user.freeHostPassActivatedDate), 6), 'PPP', { locale: enGB }) : 'N/A'; 
          statusText = `Your 6-month free host pass is active until ${fhpExp}. Enjoy full creation features!`; 
          break;
        case 'paid_host_pass_active': 
          const phpExp = user.paidHostPassExpiryDate ? format(parseISO(user.paidHostPassExpiryDate), 'PPP', { locale: enGB }) : 'N/A'; 
          statusText = `Your paid host pass is active until ${phpExp}.`; 
          actionContent = renderHostPurchaseButton(); 
          break;
        case 'free_host_pass_expired': case 'paid_host_pass_expired': 
          statusText = `Your host pass has expired. Purchase a 31-day pass ${currentPriceString} to continue creating memories.`; 
          actionContent = renderHostPurchaseButton(); 
          break;
        default: statusText = "Host pass status unknown.";
    }
    return (
      <div className="mt-2 space-y-2">
        <p className="text-sm text-muted-foreground">{statusText}</p>
        {actionContent}
      </div>
    );
  };

  const formatBytes = (bytes: number | { total: number, used: number }, decimals = 2) => {
    if (typeof bytes === 'object') bytes = bytes.used;
    if (!bytes || bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  const storageUsed = user.storageUsedBytes || 0;
  const perMemoryLimitBytes = storageQuotaBytes.total;

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <h1 className="font-headline text-4xl mb-8">Settings</h1>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader><CardTitle className="font-headline text-2xl">User Profile</CardTitle><CardDescription>Manage your account information.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20"><AvatarImage src={imageSrcForDisplay} alt={user.name || user.email || undefined} /><AvatarFallback>{showIconAsFallback ? (<UserCircle2 className="h-12 w-12 text-muted-foreground" />) : (user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?'))}</AvatarFallback></Avatar>
                  <div className="space-y-2">
                    <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()}><UploadCloud className="mr-2 h-4 w-4" /> Upload Photo</Button>
                    <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" />
                    <Button type="button" variant="outline" onClick={handleTakePhoto}><Camera className="mr-2 h-4 w-4" /> Take Photo</Button>
                    {avatarPreviewUrl && <Button type="button" variant="link" size="sm" className="text-destructive" onClick={() => { setAvatarPreviewUrl(null); setAvatarFile(null); }}>Remove Avatar</Button>}
                  </div>
                </div>
                <div className="space-y-1"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" /></div>
                <div className="space-y-1
                "><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled /><p className="text-xs text-muted-foreground">Email cannot be changed.</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-headline text-xl">Additional Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="dob-day">Date of Birth (Optional)</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <Label htmlFor="dob-day" className="sr-only">Day</Label>
                            <Select value={dobDay} onValueChange={setDobDay}>
                                <SelectTrigger id="dob-day"><SelectValue placeholder="Day" /></SelectTrigger>
                                <SelectContent>{dobDayOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="dob-month" className="sr-only">Month</Label>
                            <Select value={dobMonth} onValueChange={setDobMonth}>
                                <SelectTrigger id="dob-month"><SelectValue placeholder="Month" /></SelectTrigger>
                                <SelectContent>{dobMonths.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="dob-year" className="sr-only">Year</Label>
                            <Select value={dobYear} onValueChange={setDobYear}>
                                <SelectTrigger id="dob-year"><SelectValue placeholder="Year" /></SelectTrigger>
                                <SelectContent>{dobYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Location (Optional)</Label>
                    <div className="space-y-1">
                        <Label htmlFor="countryOfBirth" className="text-sm font-normal text-muted-foreground">Country of Birth</Label>
                        <Input id="countryOfBirth" value={countryOfBirth} onChange={(e) => setCountryOfBirth(e.target.value)} placeholder="e.g., United Kingdom" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="city" className="text-sm font-normal text-muted-foreground">City</Label>
                        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., London" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="townArea" className="text-sm font-normal text-muted-foreground">Town/Area</Label>
                        <Input id="townArea" value={townArea} onChange={(e) => setTownArea(e.target.value)} placeholder="e.g., Westminster" />
                    </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><Star className="mr-2 h-5 w-5 text-primary" /> Host Pass & Features</CardTitle>
                <CardDescription>
                  Your Host Pass grants access to memory creation, all "My Life Journey" chapters, and storage.
                  Activate a 6-month free pass, then purchase 31-day passes as needed.
                </CardDescription>
              </CardHeader>
              <CardContent>{renderHostPassStatusInfo()}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-headline text-xl flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-green-600" /> Guest Access Pass</CardTitle><CardDescription>Your pass status for viewing memories shared by others.</CardDescription></CardHeader>
              <CardContent>{renderGuestPassStatusInfo()}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-headline text-xl flex items-center"><HardDrive className="mr-2 h-5 w-5 text-accent" /> Media Storage</CardTitle><CardDescription>Your current media storage usage.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {(hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active') ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      <span>Total media stored: {formatBytes(storageUsed)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Your active host pass allows individual memories to be up to {formatBytes(perMemoryLimitBytes)}.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Activate or purchase a Host Pass to enable media storage (up to {formatBytes(STANDARD_HOST_STORAGE_QUOTA_BYTES)} per memory).
                  </p>
                )}
              </CardContent>
            </Card>
            <CardFooter className="flex justify-end p-0 pt-4"><Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}</Button></CardFooter>
          </form>
        </div>
      </div>
    </AuthenticatedPageWrapper>
  );
}