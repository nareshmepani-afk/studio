import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import BuildIdLogger from "@/components/layout/BuildIdLogger";
import { Toaster as SonnerToaster } from "@/components/ui/toaster";
import "@/utils/version"; // Import to register the console log
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Memory Weaver",
  description: "Record and share your life's most precious moments.",
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
      </head>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <Providers>
          <BuildIdLogger />
          {!isAdmin && <Navbar />}
          {children}
        </Providers>
        <SonnerToaster />
      </body>
    </html>
  );
}
