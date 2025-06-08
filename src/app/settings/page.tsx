
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
import { Loader2, UploadCloud, Camera, ShieldCheck, CalendarClock, Gift, ShoppingCart, Info, UserCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, type FormEvent, useRef, useMemo } from 'react';
import { format, isValid, parseISO, getYear, getMonth, getDate, getDaysInMonth, addMonths } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { useRouter } from 'next/navigation'; // Added for router push

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
    activateFreePass, 
    purchasePaidPass, 
    checkAndUpdatePassStatus,
    passPriceDetails,
    fetchPassPrice,
    isFetchingPassPrice
  } = useAuth();
  const router = useRouter(); // Initialize router
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileInfo, setProfileInfo] = useState('');
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
    checkAndUpdatePassStatus();
     if (user && (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired' || user.sharedAccessStatus === 'paid_pass_active')) {
      fetchPassPrice();
    }
  }, [checkAndUpdatePassStatus, user, fetchPassPrice]);

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
      setProfileInfo(user.profileInfo || '');
      setAvatarPreviewUrl(null); 

      if (user.dateOfBirth && isValid(parseISO(user.dateOfBirth))) {
        const dob = parseISO(user.dateOfBirth);
        setDobYear(getYear(dob).toString());
        setDobMonth(getMonth(dob).toString()); 
        setDobDay(getDate(dob).toString());
      } else {
        setDobYear('');
        setDobMonth('');
        setDobDay('');
      }

      setCountryOfBirth(user.countryOfBirth || '');
      setCity(user.city || '');
      setTownArea(user.townArea || '');
    }
  }, [user]);

  useEffect(() => {
    if (dobDay && parseInt(dobDay) > daysInSelectedDobMonth) {
      setDobDay(daysInSelectedDobMonth.toString());
    }
  }, [dobDay, daysInSelectedDobMonth]);


  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreviewUrl(previewUrl);
    }
  };

  const handleTakePhoto = () => {
    console.log("TODO: Implement webcam photo capture");
    toast({
      title: "Feature Coming Soon",
      description: "Webcam photo capture will be implemented in a future update.",
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    // IMPORTANT: In a real app, if avatarFile exists, upload it to a persistent storage 
    // and get a permanent URL. For this demo, we're using blob URLs for preview
    // which are temporary and won't persist across sessions if saved as user.avatarUrl.
    // For now, if a new file is uploaded, we'll assume the "real" URL would be this blob URL
    // for the purpose of the user object structure. This is not a production pattern.
    let finalAvatarUrlToSave = user.avatarUrl;
    if (avatarFile && avatarPreviewUrl) { 
      // In a real app, this would be the persistent URL from storage, not the blob.
      // For demo: we just store the blob url. This will break on next load for this user.
      // This is a known limitation of the current demo state.
      finalAvatarUrlToSave = avatarPreviewUrl; 
    }


    let finalDateOfBirth: string | undefined = undefined;
    if (dobYear && dobMonth && dobDay) {
      const yearNum = parseInt(dobYear);
      const monthNum = parseInt(dobMonth); 
      const dayNum = parseInt(dobDay);
      if (!isNaN(yearNum) && !isNaN(monthNum) && !isNaN(dayNum)) {
        const dobDate = new Date(yearNum, monthNum, dayNum);
        if (isValid(dobDate) && getYear(dobDate) === yearNum && getMonth(dobDate) === monthNum && getDate(dobDate) === dayNum) {
          finalDateOfBirth = dobDate.toISOString();
        } else {
          toast({ title: "Invalid Date of Birth", description: "Please select a valid date.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }
    }

    const updatedUser: User = {
      ...user,
      id: user.id,
      name: name,
      email: email,
      profileInfo: profileInfo,
      avatarUrl: finalAvatarUrlToSave, // Potentially saving a blob URL for demo purposes
      dateOfBirth: finalDateOfBirth,
      countryOfBirth: countryOfBirth || undefined,
      city: city || undefined,
      townArea: townArea || undefined,
      sharedAccessStatus: user.sharedAccessStatus,
      freePassActivatedDate: user.freePassActivatedDate,
      paidPassExpiryDate: user.paidPassExpiryDate,
      viewedSharedMemoryIds: user.viewedSharedMemoryIds || [],
    };

    await new Promise(resolve => setTimeout(resolve, 1000)); 

    localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
    login(updatedUser.email); 

    setIsSubmitting(false);
    toast({
      title: "Settings Saved!",
      description: "Your profile information has been updated.",
    });
  };

  useEffect(() => {
    let currentPreview = avatarPreviewUrl;
    return () => {
      if (currentPreview && currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, [avatarPreviewUrl]);


  if (authLoading) {
    return (
      <AuthenticatedPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading Settings...</h2>
          <p className="text-muted-foreground">Please wait while we retrieve your preferences.</p>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  if (!user) {
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4 text-center">
          <p>Please log in to view settings.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
        </div>
      </AuthenticatedPageWrapper>
    );
  }
  
  // Determine what to display in the Avatar
  const isUserAvatarUrlValid = user?.avatarUrl && user.avatarUrl.trim() !== '' && !user.avatarUrl.startsWith('blob:');
  const imageSrcToDisplay = avatarPreviewUrl || (isUserAvatarUrlValid ? user.avatarUrl : undefined);


  const renderPurchaseButton = () => {
    let buttonText = "Purchase 31-Day Pass (Mock)";
    if (isFetchingPassPrice) {
      buttonText = "Fetching price...";
    } else if (passPriceDetails) {
      const formattedPrice = new Intl.NumberFormat('en-GB', { style: 'currency', currency: passPriceDetails.currency }).format(passPriceDetails.passPrice);
      buttonText = `Purchase 31-Day Pass (${formattedPrice})`;
    }

    const button = (
      <Button onClick={purchasePaidPass} variant="outline" size="sm" disabled={isFetchingPassPrice}>
        {isFetchingPassPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
        {buttonText}
      </Button>
    );
    
    if (passPriceDetails && !isFetchingPassPrice && passPriceDetails.justification) {
       return (
        <TooltipProvider>
          <div className="flex flex-col items-start space-y-1">
            {button}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground flex items-center cursor-default">
                  <Info className="h-3 w-3 mr-1" /> {passPriceDetails.justification}
                </span>
              </TooltipTrigger>
              <TooltipContent align="start" className="max-w-xs">
                <p>{passPriceDetails.justification} (Based on average coffee price in London, UK: ~{new Intl.NumberFormat('en-GB', { style: 'currency', currency: passPriceDetails.currency }).format(passPriceDetails.coffeePrice)})</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );
    }
    return button;
  };
  
  const renderPassStatusInfo = () => {
    if (!user) return null;
    let statusText = "";
    let actionContent = null;

    switch (user.sharedAccessStatus) {
        case 'no_pass_initiated':
            statusText = "You have not yet activated your free pass for viewing shared memories.";
            actionContent = (
                <Button onClick={activateFreePass} variant="outline" size="sm">
                    <Gift className="mr-2 h-4 w-4" /> Activate 6-Month Free Pass
                </Button>
            );
            break;
        case 'free_pass_active':
            const freePassExpiry = user.freePassActivatedDate ? format(addMonths(parseISO(user.freePassActivatedDate), 6), 'PPP') : 'N/A';
            statusText = `Your 6-month free pass for shared memories is active until ${freePassExpiry}.`;
            break;
        case 'paid_pass_active':
            const paidPassExpiry = user.paidPassExpiryDate ? format(parseISO(user.paidPassExpiryDate), 'PPP') : 'N/A';
            statusText = `Your paid pass for shared memories is active until ${paidPassExpiry}.`;
            actionContent = renderPurchaseButton();
            break;
        case 'free_pass_expired':
        case 'paid_pass_expired':
            statusText = "Your pass for viewing shared memories has expired.";
            actionContent = renderPurchaseButton();
            break;
        default:
            statusText = "Shared memory pass status is unknown.";
    }

    return (
        <div className="mt-2 space-y-2">
            <p className="text-sm text-muted-foreground">{statusText}</p>
            {actionContent}
        </div>
    );
  };

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <h1 className="font-headline text-4xl mb-8">Settings</h1>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">User Profile</CardTitle>
                <CardDescription>Manage your account information. This helps AI generate relevant memory cues.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={imageSrcToDisplay} alt={user.name || user.email} />
                    <AvatarFallback>
                      {imageSrcToDisplay ? ( // If an image src was determined (preview or valid user avatar)
                        // This fallback is for when that image fails to load
                        user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')
                      ) : (
                        // No imageSrcToDisplay means no preview and no valid persistent user avatar
                        <UserCircle2 className="h-12 w-12 text-muted-foreground" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()}>
                      <UploadCloud className="mr-2 h-4 w-4" /> Upload Photo
                    </Button>
                    <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" />
                    <Button type="button" variant="outline" onClick={handleTakePhoto}>
                      <Camera className="mr-2 h-4 w-4" /> Take Photo
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed in this demo.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profile-info">Profile for AI Cues</Label>
                  <Textarea
                    id="profile-info"
                    value={profileInfo}
                    onChange={(e) => setProfileInfo(e.target.value)}
                    placeholder="Tell us about your interests, significant life events, favorite places, etc. The more details, the better the AI cues!"
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-xl">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Date of Birth (Optional)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="dob-day" className="sr-only">Day</Label>
                      <Select value={dobDay} onValueChange={setDobDay}>
                        <SelectTrigger id="dob-day">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {dobDayOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dob-month" className="sr-only">Month</Label>
                      <Select value={dobMonth} onValueChange={setDobMonth}>
                        <SelectTrigger id="dob-month">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {dobMonths.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dob-year" className="sr-only">Year</Label>
                      <Select value={dobYear} onValueChange={setDobYear}>
                        <SelectTrigger id="dob-year">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {dobYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                        </SelectContent>
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
                <CardTitle className="font-headline text-xl flex items-center">
                    <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Shared Memory Access
                </CardTitle>
                <CardDescription>Your current pass status for viewing memories shared by others.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderPassStatusInfo()}
              </CardContent>
            </Card>


            <CardFooter className="flex justify-end p-0 pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </div>
      </div>
    </AuthenticatedPageWrapper>
  );
}

