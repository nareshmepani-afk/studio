import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import BuildIdLogger from "@/components/layout/BuildIdLogger";
import { Toaster as SonnerToaster } from "@/components/ui/toaster";
import { GoogleAnalytics } from "@/components/public/GoogleAnalytics";
import { CookieConsentDock } from "@/components/public/CookieConsentDock";
import "@/utils/version";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://memoryweaver.studio'),
  title: {
    default: "Memory Weaver — Spoken Memoir & Family Cinema Studio",
    template: "%s | Memory Weaver",
  },
  description:
    "Record, produce, and publish your family's spoken memoirs as cinematic experiences. A 5-Act documentary production suite with Smart TV streaming, QR poster distribution, and generational archival preservation.",
  keywords: [
    "oral history",
    "family memoir",
    "spoken autobiography",
    "documentary production",
    "video memoir",
    "family cinema",
    "voice recording",
    "generational archive",
    "Smart TV streaming",
    "QR code poster",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Memory Weaver — Spoken Memoir & Family Cinema Studio",
    description:
      "Your voice. Your story. Published forever. A 5-Act production suite for preserving family stories across generations.",
    siteName: "Memory Weaver",
    locale: "en_GB",
    type: "website",
    url: "https://memoryweaver.studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memory Weaver — Spoken Memoir & Family Cinema Studio",
    description:
      "Your voice. Your story. Published forever. A 5-Act production suite for preserving family stories across generations.",
  },
};

const schemaOrgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Memory Weaver",
      "url": "https://memoryweaver.studio",
      "description":
        "A spoken oral history and documentary production studio for preserving family stories across generations.",
    },
    {
      "@type": "SoftwareApplication",
      "name": "Memory Weaver",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Web",
      "description":
        "A 5-Act spoken memoir production suite with cinematic voice capture, AI narrative synthesis, Smart TV streaming, QR poster distribution, and generational archival preservation.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "GBP",
        "description": "Complimentary 6-Month Director Host Pass with 5 GB cloud vault",
      },
      "author": {
        "@type": "Organization",
        "name": "Memory Weaver",
        "url": "https://memoryweaver.studio",
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get('x-original-host') || headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const isAdmin = host.startsWith('admin.');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="app-version" content={process.env.NEXT_PUBLIC_APP_VERSION} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJsonLd) }}
        />
      </head>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <Providers>
          <BuildIdLogger />
          {!isAdmin && <Navbar />}
          {children}
        </Providers>
        <GoogleAnalytics />
        <CookieConsentDock />
        <SonnerToaster />
      </body>
    </html>
  );
}
