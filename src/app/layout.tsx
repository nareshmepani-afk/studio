
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/layout/Providers";
import SessionWatcher from "@/components/auth/SessionWatcher";
import BuildIdLogger from "@/components/layout/BuildIdLogger";
import "./globals.css";

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
        <meta name="version" content={process.env.NEXT_PUBLIC_COMMIT_HASH} />
        <link rel="icon" href="data:;base64,=" />
      </head>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <Providers>
          <SessionWatcher />
          <BuildIdLogger />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
