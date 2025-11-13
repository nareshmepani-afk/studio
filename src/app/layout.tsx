
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";
import React from "react";
// import { ClientSideLayout } from "@/components/layout/ClientSideLayout";

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
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* ClientSideLayout is no longer needed as FFmpeg is loaded via npm packages */}
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
