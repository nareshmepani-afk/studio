
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { User } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/types'; 
import { Loader2, UploadCloud, Camera, ShieldCheck, CalendarClock, Gift, ShoppingCart, Info, UserCircle2, HardDrive, AlertTriangle, Star, Zap, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Progress component is removed as it's no longer used
import { useState, useEffect, type FormEvent, useRef, useMemo } from 'react';
import { format, isValid, parseISO, getYear, getMonth, getDate, getDaysInMonth, addMonths } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { useRouter } from 'next/navigation'; 

const currentGlobalYear = new Date().getFullYear();
const dobYears: number[] = Array.from({ length: 120 }, (_, i) => currentGlobalYear - i); 
const dobMonths: { value: number; label: string }[] = Array.from({ length: 12 }, (_, i) => ({
  value: i, 
  label: format(new Date(2000, i, 1), 'MMMM', { locale: enGB }),
}));

export default function SettingsPage() {
  const { 
    user, 
    login, 
    loading: authLoading, 
    activateFreeGuestPass, 
    purchasePaidGuestPass, 
    checkAndUpdateGuestPassStatus,
    guestPassPriceDetails,
    fetchGuestPassPrice,
    isFetchingGuestPassPrice,
    activateFreeHostPass,
    purchasePaidHostPass,
    checkAndUpdateHostPassStatus,
    hostPassPriceDetails,
    fetchHostPassPrice,
    isFetchingHostPassPrice: isFetchingAuthHostPassPrice, // Corrected alias to avoid conflict
    resetHostPassForTesting,
    storageQuotaBytes, 
    calculateAndUpdateStorageUsage,
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
  
  useEffect(() => {
    checkAndUpdateGuestPassStatus();
    checkAndUpdateHostPassStatus();
    
    if (user) { 
        if (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired' || user.sharedAccessStatus === 'no_pass_initiated') {
            if (!isFetchingGuestPassPrice && !guestPassPriceDetails) fetchGuestPassPrice();
        }
        if (user.hostPassStatus === 'free_host_pass_expired' || user.hostPassStatus === 'paid_host_pass_expired' || user.hostPassStatus === 'no_pass_initiated') {
           if (!isFetchingAuthHostPassPrice && !hostPassPriceDetails) fetchHostPassPrice();
        }
        calculateAndUpdateStorageUsage(user.id);
    }
  }, [
    checkAndUpdateGuestPassStatus, 
    checkAndUpdateHostPassStatus, 
    fetchGuestPassPrice, 
    fetchHostPassPrice, 
    calculateAndUpdateStorageUsage,
    user?.sharedAccessStatus, 
    user?.hostPassStatus,
    user?.id,
    isFetchingGuestPassPrice, guestPassPriceDetails, 
    isFetchingAuthHostPassPrice, hostPassPriceDetails   
  ]);


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
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarPreviewUrl(null); 

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

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreviewUrl(previewUrl);
    }
  };

  const handleTakePhoto = () => {
    toast({ title: "Feature Coming Soon", description: "Webcam photo capture will be implemented." });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    let finalAvatarUrlToSave = user.avatarUrl;
    if (avatarFile && avatarPreviewUrl) finalAvatarUrlToSave = avatarPreviewUrl; 

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
    const updatedUser: User = {
      ...user, id: user.id, name: name, email: email, avatarUrl: finalAvatarUrlToSave, 
      dateOfBirth: finalDateOfBirth, countryOfBirth: countryOfBirth || undefined, city: city || undefined, townArea: townArea || undefined,
      sharedAccessStatus: user.sharedAccessStatus, freePassActivatedDate: user.freePassActivatedDate, paidPassExpiryDate: user.paidPassExpiryDate,
      hostPassStatus: user.hostPassStatus, freeHostPassActivatedDate: user.freeHostPassActivatedDate, paidHostPassExpiryDate: user.paidHostPassExpiryDate, 
      viewedSharedMemoryIds: user.viewedSharedMemoryIds || [], storageUsedBytes: user.storageUsedBytes,
    };
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
    login(updatedUser.email); 
    setIsSubmitting(false);
    toast({ title: "Settings Saved!", description: "Your profile information has been updated." });
  };

  useEffect(() => { let currentPreview = avatarPreviewUrl; return () => { if (currentPreview && currentPreview.startsWith('blob:')) URL.revokeObjectURL(currentPreview); }; }, [avatarPreviewUrl]);

  if (authLoading) return (<AuthenticatedPageWrapper><div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><h2 className="text-2xl font-headline mb-2">Loading Settings...</h2></div></AuthenticatedPageWrapper>);
  if (!user) return (<AuthenticatedPageWrapper><div className="container mx-auto py-8 px-4 text-center"><p>Please log in.</p><Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button></div></AuthenticatedPageWrapper>);
  
  const isEffectivelyEmptyOrPlaceholderAvatar = (url?: string): boolean => (!url || url.trim() === '' || url.startsWith('blob:') || url.startsWith('https://avatar.vercel.sh/'));
  let imageSrcForDisplay: string | undefined = avatarPreviewUrl || (user.avatarUrl && !isEffectivelyEmptyOrPlaceholderAvatar(user.avatarUrl) ? user.avatarUrl : undefined);
  let showIconAsFallback = !imageSrcForDisplay;

  const renderGuestPurchaseButton = () => {
    let buttonText = "Purchase 31-Day Guest Pass";
    if (isFetchingGuestPassPrice) buttonText = "Fetching price...";
    else if (guestPassPriceDetails) buttonText = `Purchase 31-Day Guest Pass (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.passPrice)})`;
    const button = (<Button onClick={purchasePaidGuestPass} variant="outline" size="sm" disabled={isFetchingGuestPassPrice}>{isFetchingGuestPassPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}{buttonText}</Button>);
    if (guestPassPriceDetails && !isFetchingGuestPassPrice && guestPassPriceDetails.justification) {
       return (<TooltipProvider><div className="flex flex-col items-start space-y-1">{button}<Tooltip><TooltipTrigger asChild><span className="text-xs text-muted-foreground flex items-center cursor-default"><Info className="h-3 w-3 mr-1" /> {guestPassPriceDetails.justification}</span></TooltipTrigger><TooltipContent align="start" className="max-w-xs"><p>{guestPassPriceDetails.justification} (Based on avg coffee: ~{new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.coffeePrice)})</p></TooltipContent></Tooltip></div></TooltipProvider>);
    }
    return button;
  };
  
  const renderGuestPassStatusInfo = () => {
    if (!user) return null;
    let statusText = ""; let actionContent = null;
    switch (user.sharedAccessStatus) {
        case 'no_pass_initiated': statusText = "Activate your free guest pass for viewing shared memories."; actionContent = (<Button onClick={activateFreeGuestPass} variant="outline" size="sm"><Gift className="mr-2 h-4 w-4" /> Activate 6-Month Free Guest Pass</Button>); break;
        case 'free_pass_active': const fpExp = user.freePassActivatedDate ? format(addMonths(parseISO(user.freePassActivatedDate), 6), 'PPP') : 'N/A'; statusText = `Your 6-month free guest pass is active until ${fpExp}.`; break;
        case 'paid_pass_active': const ppExp = user.paidPassExpiryDate ? format(parseISO(user.paidPassExpiryDate), 'PPP') : 'N/A'; statusText = `Your paid guest pass is active until ${ppExp}.`; actionContent = renderGuestPurchaseButton(); break;
        case 'free_pass_expired': case 'paid_pass_expired': statusText = "Your guest pass has expired."; actionContent = renderGuestPurchaseButton(); break;
        default: statusText = "Guest pass status unknown.";
    }
    return (<div className="mt-2 space-y-2"><p className="text-sm text-muted-foreground">{statusText}</p>{actionContent}</div>);
  };

  const renderHostPurchaseButton = () => {
    let buttonText = "Purchase 31-Day Host Pass";
    if (isFetchingAuthHostPassPrice) buttonText = "Fetching price..."; // Use alias here
    else if (hostPassPriceDetails) buttonText = `Purchase 31-Day Host Pass (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.passPrice)})`;
    else buttonText = `Purchase 31-Day Host Pass (£12.99 - Mock)`; 

    const button = (<Button onClick={purchasePaidHostPass} variant="default" size="sm" disabled={isFetchingAuthHostPassPrice}>{isFetchingAuthHostPassPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}{buttonText}</Button>);
    
    if (hostPassPriceDetails && !isFetchingAuthHostPassPrice && hostPassPriceDetails.justification) {
       return (<TooltipProvider><div className="flex flex-col items-start space-y-1">{button}<Tooltip><TooltipTrigger asChild><span className="text-xs text-muted-foreground flex items-center cursor-default"><Info className="h-3 w-3 mr-1" /> {hostPassPriceDetails.justification}</span></TooltipTrigger><TooltipContent align="start" className="max-w-xs"><p>{hostPassPriceDetails.justification} (Based on avg coffee: ~{new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.coffeePrice)})</p></TooltipContent></Tooltip></div></TooltipProvider>);
    }
    return button;
  };

  const renderHostPassStatusInfo = () => {
    if (!user) return null;
    let statusText = ""; let actionContent = null;
    let currentPriceString = "";
    if (hostPassPriceDetails && !isFetchingAuthHostPassPrice) {
        currentPriceString = `(${new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.passPrice)})`;
    } else if (isFetchingAuthHostPassPrice) {
        currentPriceString = "(fetching price...)";
    } else {
         currentPriceString = "(approx. £12.99 - Mock)"; 
    }

    switch (user.hostPassStatus) {
        case 'no_pass_initiated': 
          statusText = "Activate your free host pass to begin creating memories and access all features."; 
          actionContent = (<Button onClick={activateFreeHostPass} variant="default" size="sm"><Star className="mr-2 h-4 w-4" /> Activate 6-Month Free Host Pass</Button>); 
          break;
        case 'free_host_pass_active': 
          const fhpExp = user.freeHostPassActivatedDate ? format(addMonths(parseISO(user.freeHostPassActivatedDate), 6), 'PPP') : 'N/A'; 
          statusText = `Your 6-month free host pass is active until ${fhpExp}. Enjoy full creation features!`; 
          break;
        case 'paid_host_pass_active': 
          const phpExp = user.paidHostPassExpiryDate ? format(parseISO(user.paidHostPassExpiryDate), 'PPP') : 'N/A'; 
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
        <div className="mt-3 border-t pt-3">
            <p className="text-xs text-muted-foreground mb-1">For Testing: Current `hostPassStatus`: <code className="font-mono bg-muted p-1 rounded">{user.hostPassStatus || 'N/A'}</code></p>
            <Button 
              onClick={resetHostPassForTesting} 
              variant="outline" 
              size="sm" 
              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Host Pass (For Testing)
            </Button>
        </div>
      </div>
    );
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  const storageUsed = user.storageUsedBytes || 0;
  const perMemoryLimitBytes = (user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active') ? storageQuotaBytes : 0;


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
                  <Avatar className="h-20 w-20"><AvatarImage src={imageSrcForDisplay} alt={user.name || user.email} /><AvatarFallback>{showIconAsFallback ? (<UserCircle2 className="h-12 w-12 text-muted-foreground" />) : (user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?'))}</AvatarFallback></Avatar>
                  <div className="space-y-2"><Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()}><UploadCloud className="mr-2 h-4 w-4" /> Upload Photo</Button><input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" /><Button type="button" variant="outline" onClick={handleTakePhoto}><Camera className="mr-2 h-4 w-4" /> Take Photo</Button></div>
                </div>
                <div className="space-y-1"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" /></div>
                <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled /><p className="text-xs text-muted-foreground">Email cannot be changed in this demo.</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-headline text-xl">Additional Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><Label>Date of Birth (Optional)</Label><div className="grid grid-cols-3 gap-2"><div><Label htmlFor="dob-day" className="sr-only">Day</Label><Select value={dobDay} onValueChange={setDobDay}><SelectTrigger id="dob-day"><SelectValue placeholder="Day" /></SelectTrigger><SelectContent>{dobDayOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="dob-month" className="sr-only">Month</Label><Select value={dobMonth} onValueChange={setDobMonth}><SelectTrigger id="dob-month"><SelectValue placeholder="Month" /></SelectTrigger><SelectContent>{dobMonths.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="dob-year" className="sr-only">Year</Label><Select value={dobYear} onValueChange={setDobYear}><SelectTrigger id="dob-year"><SelectValue placeholder="Year" /></SelectTrigger><SelectContent>{dobYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select></div></div></div>
                <div className="space-y-2"><Label>Location (Optional)</Label><div className="space-y-1"><Label htmlFor="countryOfBirth" className="text-sm font-normal text-muted-foreground">Country of Birth</Label><Input id="countryOfBirth" value={countryOfBirth} onChange={(e) => setCountryOfBirth(e.target.value)} placeholder="e.g., United Kingdom" /></div><div className="space-y-1"><Label htmlFor="city" className="text-sm font-normal text-muted-foreground">City</Label><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., London" /></div><div className="space-y-1"><Label htmlFor="townArea" className="text-sm font-normal text-muted-foreground">Town/Area</Label><Input id="townArea" value={townArea} onChange={(e) => setTownArea(e.target.value)} placeholder="e.g., Westminster" /></div></div>
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
                {(user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active') ? (
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

    
