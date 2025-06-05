
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
import { Loader2, UploadCloud, Camera } from 'lucide-react';
import { useState, useEffect, type FormEvent, useRef, useMemo } from 'react';
import { format, isValid, parseISO, getYear, getMonth, getDate, getDaysInMonth } from 'date-fns';
import { enGB } from 'date-fns/locale';

const currentGlobalYear = new Date().getFullYear();
const dobYears: number[] = Array.from({ length: 120 }, (_, i) => currentGlobalYear - i); // Up to 120 years ago
const dobMonths: { value: number; label: string }[] = Array.from({ length: 12 }, (_, i) => ({
  value: i, // 0-11 for Date object compatibility
  label: format(new Date(2000, i, 1), 'MMMM', { locale: enGB }),
}));

export default function SettingsPage() {
  const { user, login, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileInfo, setProfileInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New profile fields state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [dobYear, setDobYear] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>(''); // 0-11
  const [dobDay, setDobDay] = useState<string>('');

  const [countryOfBirth, setCountryOfBirth] = useState('');
  const [city, setCity] = useState('');
  const [townArea, setTownArea] = useState('');

  const daysInSelectedDobMonth = useMemo(() => {
    if (dobYear && dobMonth) {
      const yearNum = parseInt(dobYear);
      const monthNum = parseInt(dobMonth); // 0-indexed
      if (!isNaN(yearNum) && !isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
        return getDaysInMonth(new Date(yearNum, monthNum));
      }
    }
    return 31; // Default to 31 if year/month not set
  }, [dobYear, dobMonth]);

  const dobDayOptions = useMemo(() => {
    return Array.from({ length: daysInSelectedDobMonth }, (_, i) => (i + 1).toString());
  }, [daysInSelectedDobMonth]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfileInfo(user.profileInfo || '');
      setAvatarPreviewUrl(user.avatarUrl || null); // Initialize preview with existing avatar

      if (user.dateOfBirth && isValid(parseISO(user.dateOfBirth))) {
        const dob = parseISO(user.dateOfBirth);
        setDobYear(getYear(dob).toString());
        setDobMonth(getMonth(dob).toString()); // 0-11
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
    // Adjust day if it becomes invalid for the selected month/year
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
    // For now, this is a placeholder
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

    let finalAvatarUrl = user.avatarUrl;
    if (avatarFile && avatarPreviewUrl) {
      // In a real app, upload avatarFile here and get a persistent URL
      // For this demo, we'll use the blob URL (avatarPreviewUrl) or a placeholder
      // This blob URL will only work for the current session
      finalAvatarUrl = avatarPreviewUrl;
      // To make it somewhat persistent in localStorage for the demo if not a blob:
      // if (!avatarPreviewUrl.startsWith('blob:')) finalAvatarUrl = avatarPreviewUrl; 
      // else console.warn("Avatar preview is a blob URL, won't persist across sessions well in demo.");
    }

    let finalDateOfBirth: string | undefined = undefined;
    if (dobYear && dobMonth && dobDay) {
      const yearNum = parseInt(dobYear);
      const monthNum = parseInt(dobMonth); // 0-indexed
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
      avatarUrl: finalAvatarUrl,
      dateOfBirth: finalDateOfBirth,
      countryOfBirth: countryOfBirth || undefined,
      city: city || undefined,
      townArea: townArea || undefined,
    };

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
    login(updatedUser.email); // This re-sets the user in AuthContext, triggering Navbar update etc.

    setIsSubmitting(false);
    toast({
      title: "Settings Saved!",
      description: "Your profile information has been updated.",
    });
  };

  useEffect(() => {
    // Clean up blob URL when component unmounts or avatarPreviewUrl changes to a new blob
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
        <div className="container mx-auto py-8 px-4">Loading settings...</div>
      </AuthenticatedPageWrapper>
    );
  }

  if (!user) {
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4">Please log in to view settings.</div>
      </AuthenticatedPageWrapper>
    );
  }

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
                    <AvatarImage src={avatarPreviewUrl || user.avatarUrl || `https://avatar.vercel.sh/${email}.png`} alt={name || email} />
                    <AvatarFallback>{name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}</AvatarFallback>
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
