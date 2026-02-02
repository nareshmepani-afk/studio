
import React from "react";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { StudioProviders } from "./StudioProviders";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function StudioLayout({
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
        <StudioProviders>{children}</StudioProviders>
        <Toaster />
      </body>
    </html>
  );
}
