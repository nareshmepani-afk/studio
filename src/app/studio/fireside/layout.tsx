'use client';

import React from 'react';
import { HardwarePrivacyProvider } from '@/context/HardwarePrivacyContext';

export default function FiresideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HardwarePrivacyProvider>{children}</HardwarePrivacyProvider>;
}
