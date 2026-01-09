
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/layout/Providers";
import SessionWatcher from "@/components/auth/SessionWatcher";
import "./globals.css";
import React from "react";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Memory Weaver",
  description: "Record and share your life's most precious moments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:;base64,=" />
      </head>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <Providers>
          <SessionWatcher />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
