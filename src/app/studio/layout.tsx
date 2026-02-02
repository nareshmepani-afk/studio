
import React from "react";
import { StudioProviders } from "./StudioProviders";

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
      <body suppressHydrationWarning>
        <StudioProviders>{children}</StudioProviders>
      </body>
    </html>
  );
}
